import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { alias } from 'drizzle-orm/pg-core';
import type { z } from 'zod';
import {
  and,
  count,
  desc,
  donations,
  eq,
  gte,
  ilike,
  lte,
  or,
  participants,
  sql,
  sum,
  type SQL,
} from '@asv/db';
import type { DonationInput, donationListQuery } from '@asv/shared';
import { DB, type Database } from '../db/database.module';
import { like, offset } from '../common/pagination';

type ListQuery = z.infer<typeof donationListQuery>;
const receiver = alias(participants, 'receiver');

@Injectable()
export class DonationsService {
  constructor(@Inject(DB) private readonly db: Database) {}

  private where(q: Partial<ListQuery>) {
    const conds: (SQL | undefined)[] = [];
    if (q.type) conds.push(eq(donations.type, q.type));
    if (q.from) conds.push(gte(donations.donatedOn, q.from));
    if (q.to) conds.push(lte(donations.donatedOn, q.to));
    if (q.search) {
      const t = like(q.search);
      conds.push(
        or(
          ilike(donations.firstName, t),
          ilike(donations.lastName, t),
          ilike(donations.familyName, t),
          ilike(donations.email, t),
          ilike(donations.phone, t),
        ),
      );
    }
    return and(...conds);
  }

  private select() {
    return this.db
      .select({
        id: donations.id,
        participantId: donations.participantId,
        firstName: donations.firstName,
        lastName: donations.lastName,
        familyName: donations.familyName,
        email: donations.email,
        phone: donations.phone,
        amountCents: donations.amountCents,
        type: donations.type,
        donatedOn: donations.donatedOn,
        notes: donations.notes,
        receivedById: donations.receivedById,
        receivedByName: sql<string>`${receiver.firstName} || ' ' || ${receiver.lastName}`,
        receivedByFirstName: receiver.firstName,
      })
      .from(donations)
      .innerJoin(receiver, eq(receiver.id, donations.receivedById));
  }

  async list(q: ListQuery) {
    const where = this.where(q);
    const [items, [agg]] = await Promise.all([
      this.select()
        .where(where)
        .orderBy(desc(donations.donatedOn), desc(donations.createdAt))
        .limit(q.pageSize)
        .offset(offset(q)),
      this.db
        .select({ n: count(), total: sum(donations.amountCents) })
        .from(donations)
        .where(where),
    ]);
    return {
      items,
      total: agg?.n ?? 0,
      totalAmountCents: Number(agg?.total ?? 0),
      page: q.page,
      pageSize: q.pageSize,
    };
  }

  async get(id: string) {
    const [row] = await this.select().where(eq(donations.id, id));
    if (!row) throw new NotFoundException('Donation not found');
    return row;
  }

  /** Resolve donor snapshot, optionally linking/creating a participant, in one transaction. */
  async create(input: DonationInput, userId: string) {
    const id = await this.db.transaction(async (tx) => {
      let donor: {
        participantId: string | null;
        firstName: string;
        lastName: string;
        familyName: string | null;
        email: string | null;
        phone: string | null;
      };

      if (input.participantId) {
        const [p] = await tx
          .select()
          .from(participants)
          .where(eq(participants.id, input.participantId));
        if (!p) throw new NotFoundException('Participant not found');
        donor = {
          participantId: p.id,
          firstName: p.firstName,
          lastName: p.lastName,
          familyName: p.familyName,
          email: p.email,
          phone: p.phone,
        };
      } else {
        donor = {
          participantId: null,
          firstName: input.firstName!,
          lastName: input.lastName!,
          familyName: input.familyName,
          email: input.email,
          phone: input.phone,
        };
        if (input.saveAsParticipant) {
          // Reuse an existing participant with the same email rather than failing on the unique index.
          const [existing] = input.email
            ? await tx
                .select({ id: participants.id })
                .from(participants)
                .where(sql`lower(${participants.email}) = ${input.email}`)
            : [];
          if (existing) donor.participantId = existing.id;
          else {
            const [created] = await tx
              .insert(participants)
              .values({
                firstName: donor.firstName,
                lastName: donor.lastName,
                familyName: donor.familyName,
                email: donor.email,
                phone: donor.phone,
              })
              .returning({ id: participants.id });
            donor.participantId = created!.id;
          }
        }
      }

      const [row] = await tx
        .insert(donations)
        .values({
          ...donor,
          amountCents: input.amountCents,
          type: input.type,
          donatedOn: input.donatedOn,
          receivedById: input.receivedById,
          notes: input.notes,
          createdByUserId: userId,
        })
        .returning({ id: donations.id });
      return row!.id;
    });
    return this.get(id);
  }

  async update(id: string, input: DonationInput) {
    const [row] = await this.db
      .update(donations)
      .set({
        amountCents: input.amountCents,
        type: input.type,
        donatedOn: input.donatedOn,
        receivedById: input.receivedById,
        notes: input.notes,
        ...(input.firstName && input.lastName
          ? {
              firstName: input.firstName,
              lastName: input.lastName,
              familyName: input.familyName,
              email: input.email,
              phone: input.phone,
            }
          : {}),
      })
      .where(eq(donations.id, id))
      .returning({ id: donations.id });
    if (!row) throw new NotFoundException('Donation not found');
    return this.get(id);
  }

  async remove(id: string) {
    const [row] = await this.db.delete(donations).where(eq(donations.id, id)).returning();
    if (!row) throw new NotFoundException('Donation not found');
  }

  async exportCsv(q: ListQuery) {
    const rows = await this.select().where(this.where(q)).orderBy(desc(donations.donatedOn));
    const esc = (v: unknown) => {
      let s = String(v ?? '');
      if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`; // neutralise spreadsheet formula injection
      return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const header = [
      'date',
      'first_name',
      'last_name',
      'family_name',
      'email',
      'phone',
      'amount',
      'type',
      'received_by',
    ];
    const lines = rows.map((r) =>
      [
        r.donatedOn.split('-').reverse().join('/'),
        r.firstName,
        r.lastName,
        r.familyName,
        r.email,
        r.phone,
        (r.amountCents / 100).toFixed(2),
        r.type,
        r.receivedByName,
      ]
        .map(esc)
        .join(','),
    );
    return [header.join(','), ...lines].join('\n');
  }
}

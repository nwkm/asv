import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, asc, desc, eq, participants, serviceAssignments, services, sql } from '@asv/db';
import type { ServiceInput } from '@asv/shared';
import { DB, type Database } from '../db/database.module';

@Injectable()
export class ServicesService {
  constructor(@Inject(DB) private readonly db: Database) {}

  list() {
    return this.db
      .select({
        id: services.id,
        title: services.title,
        description: services.description,
        location: services.location,
        startsAt: services.startsAt,
        endsAt: services.endsAt,
        assigned: sql<number>`(select count(*)::int from service_assignments a where a.service_id = ${services.id})`,
      })
      .from(services)
      .orderBy(desc(services.startsAt));
  }

  async get(id: string) {
    const [service] = await this.db.select().from(services).where(eq(services.id, id));
    if (!service) throw new NotFoundException('Service not found');
    return { ...service, participants: await this.participantsOf(id) };
  }

  participantsOf(serviceId: string) {
    return this.db
      .select({
        id: participants.id,
        firstName: participants.firstName,
        lastName: participants.lastName,
        email: participants.email,
        phone: participants.phone,
        task: serviceAssignments.task,
      })
      .from(serviceAssignments)
      .innerJoin(participants, eq(participants.id, serviceAssignments.participantId))
      .where(eq(serviceAssignments.serviceId, serviceId))
      .orderBy(asc(participants.lastName), asc(participants.firstName));
  }

  async create(input: ServiceInput) {
    const [row] = await this.db
      .insert(services)
      .values({ ...input, startsAt: new Date(input.startsAt), endsAt: new Date(input.endsAt) })
      .returning();
    return row!;
  }

  async update(id: string, input: ServiceInput) {
    const [row] = await this.db
      .update(services)
      .set({ ...input, startsAt: new Date(input.startsAt), endsAt: new Date(input.endsAt) })
      .where(eq(services.id, id))
      .returning();
    if (!row) throw new NotFoundException('Service not found');
    return row;
  }

  async remove(id: string) {
    const [row] = await this.db.delete(services).where(eq(services.id, id)).returning();
    if (!row) throw new NotFoundException('Service not found');
  }

  async assign(serviceId: string, participantId: string, task: string | null) {
    await this.db
      .insert(serviceAssignments)
      .values({ serviceId, participantId, task })
      .onConflictDoUpdate({
        target: [serviceAssignments.serviceId, serviceAssignments.participantId],
        set: { task },
      });
    return this.participantsOf(serviceId);
  }

  async unassign(serviceId: string, participantId: string) {
    await this.db
      .delete(serviceAssignments)
      .where(
        and(
          eq(serviceAssignments.serviceId, serviceId),
          eq(serviceAssignments.participantId, participantId),
        ),
      );
  }
}

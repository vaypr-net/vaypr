import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

// Deliberately separate from User: deleting an account must not erase its audit
// or sever the original subscriber ID used by the financial ledgers.
@Schema({ timestamps: true, collection: 'subscriber_deletions' })
export class SubscriberDeletion {
  @Prop({ required: true, unique: true }) subscriberId: string;
  @Prop({ required: true }) subscriberName: string;
  @Prop({ required: true }) subscriberEmail: string;
  @Prop({ required: true }) deletedAt: Date;
  @Prop({ required: true }) actorId: string;
  @Prop({ required: true }) actorEmail: string;
  @Prop({ required: true }) reason: string;
  @Prop({ type: Object, required: true }) deletedCounts: Record<string, number>;
  @Prop({ type: Object, required: true }) retainedCounts: Record<
    string,
    number
  >;
  @Prop({ type: [Object], default: [] }) managementHistory: Record<
    string,
    unknown
  >[];
}
export const SubscriberDeletionSchema =
  SchemaFactory.createForClass(SubscriberDeletion);
SubscriberDeletionSchema.index({ deletedAt: -1 });

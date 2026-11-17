import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type WorkspaceDocument = Workspace & Document;

export type WorkspaceMemberRole = 'owner' | 'editor' | 'viewer';

export class WorkspaceMember {
  userId: Types.ObjectId;
  role: WorkspaceMemberRole;
  joinedAt: Date;
}

@Schema({ timestamps: true })
export class Workspace {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ default: '📝' })
  icon: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  ownerId: Types.ObjectId;

  @Prop({
    type: [
      {
        userId: { type: Types.ObjectId, ref: 'User' },
        role: { type: String, enum: ['owner', 'editor', 'viewer'], default: 'editor' },
        joinedAt: { type: Date, default: Date.now },
      },
    ],
    default: [],
  })
  members: WorkspaceMember[];

  @Prop({ default: false })
  isPublic: boolean;
}

export const WorkspaceSchema = SchemaFactory.createForClass(Workspace);

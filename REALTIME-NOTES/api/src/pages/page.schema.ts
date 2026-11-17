import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type PageDocument = Page & Document;

export type BlockType =
  | 'paragraph'
  | 'heading1'
  | 'heading2'
  | 'heading3'
  | 'bulletList'
  | 'numberedList'
  | 'code'
  | 'quote'
  | 'divider'
  | 'todo';

export class Block {
  id: string;
  type: BlockType;
  content: string;
  meta: {
    checked?: boolean;
    language?: string;
    indent?: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

@Schema({ timestamps: true })
export class Page {
  @Prop({ required: true, trim: true, default: 'Untitled' })
  title: string;

  @Prop({ default: '📄' })
  icon: string;

  @Prop({ type: Types.ObjectId, ref: 'Workspace', required: true })
  workspaceId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  lastEditedBy: Types.ObjectId;

  @Prop({ default: null })
  lastEditedAt: Date;

  @Prop({ type: Types.ObjectId, ref: 'Page', default: null })
  parentPageId: Types.ObjectId;

  @Prop({
    type: [
      {
        id: String,
        type: { type: String, default: 'paragraph' },
        content: { type: String, default: '' },
        meta: { type: Object, default: {} },
        createdAt: { type: Date, default: Date.now },
        updatedAt: { type: Date, default: Date.now },
      },
    ],
    default: [],
  })
  blocks: Block[];

  @Prop({ default: 0 })
  version: number;

  @Prop({ default: false })
  isDeleted: boolean;
}

export const PageSchema = SchemaFactory.createForClass(Page);

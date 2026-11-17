import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { Page, PageDocument, Block } from './page.schema';

@Injectable()
export class PagesService {
  constructor(@InjectModel(Page.name) private pageModel: Model<PageDocument>) {}

  async create(workspaceId: string, userId: string, parentPageId?: string) {
    const page = await this.pageModel.create({
      title: 'Untitled',
      workspaceId: new Types.ObjectId(workspaceId),
      createdBy: new Types.ObjectId(userId),
      parentPageId: parentPageId ? new Types.ObjectId(parentPageId) : null,
      blocks: [{ id: uuidv4(), type: 'paragraph', content: '', meta: {}, createdAt: new Date(), updatedAt: new Date() }],
    });
    return page;
  }

  async findByWorkspace(workspaceId: string) {
    return this.pageModel
      .find({ workspaceId: new Types.ObjectId(workspaceId), isDeleted: false })
      .select('title icon parentPageId createdBy lastEditedAt version')
      .sort({ createdAt: 1 })
      .exec();
  }

  async findById(pageId: string): Promise<PageDocument> {
    const page = await this.pageModel.findById(pageId).exec();
    if (!page || page.isDeleted) throw new NotFoundException('Page not found');
    return page;
  }

  async updateTitle(pageId: string, title: string, userId: string) {
    return this.pageModel.findByIdAndUpdate(
      pageId,
      { title, lastEditedBy: new Types.ObjectId(userId), lastEditedAt: new Date(), $inc: { version: 1 } },
      { new: true },
    );
  }

  async applyBlockOperation(
    pageId: string,
    operation: { type: string; blockId?: string; block?: Partial<Block>; position?: number; newIndex?: number; content?: string },
    userId: string,
  ) {
    const page = await this.findById(pageId);

    if (operation.type === 'insertBlock') {
      const newBlock: Block = {
        id: uuidv4(),
        type: operation.block?.type || 'paragraph',
        content: operation.block?.content || '',
        meta: operation.block?.meta || {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const pos = operation.position ?? page.blocks.length;
      page.blocks.splice(pos, 0, newBlock);
      operation.block = newBlock;
    }

    if (operation.type === 'updateBlock') {
      const idx = page.blocks.findIndex((b) => b.id === operation.blockId);
      if (idx !== -1) {
        page.blocks[idx] = {
          ...page.blocks[idx],
          content: operation.content ?? page.blocks[idx].content,
          type: operation.block?.type ?? page.blocks[idx].type,
          meta: operation.block?.meta ?? page.blocks[idx].meta,
          updatedAt: new Date(),
        };
      }
    }

    if (operation.type === 'deleteBlock') {
      page.blocks = page.blocks.filter((b) => b.id !== operation.blockId);
    }

    if (operation.type === 'moveBlock') {
      const idx = page.blocks.findIndex((b) => b.id === operation.blockId);
      if (idx !== -1 && operation.newIndex !== undefined) {
        const [moved] = page.blocks.splice(idx, 1);
        page.blocks.splice(operation.newIndex, 0, moved);
      }
    }

    page.version += 1;
    page.lastEditedBy = new Types.ObjectId(userId) as any;
    page.lastEditedAt = new Date();
    page.markModified('blocks');
    await page.save();

    return { page, operation };
  }

  async softDelete(pageId: string) {
    return this.pageModel.findByIdAndUpdate(pageId, { isDeleted: true });
  }
}

import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Workspace, WorkspaceDocument } from './workspace.schema';

@Injectable()
export class WorkspacesService {
  constructor(
    @InjectModel(Workspace.name) private workspaceModel: Model<WorkspaceDocument>,
  ) {}

  async create(name: string, userId: string) {
    const workspace = await this.workspaceModel.create({
      name,
      ownerId: new Types.ObjectId(userId),
      members: [{ userId: new Types.ObjectId(userId), role: 'owner', joinedAt: new Date() }],
    });
    return workspace;
  }

  async findByUser(userId: string) {
    return this.workspaceModel
      .find({ 'members.userId': new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .exec();
  }

  async findById(id: string) {
    const ws = await this.workspaceModel.findById(id).exec();
    if (!ws) throw new NotFoundException('Workspace not found');
    return ws;
  }

  async addMember(workspaceId: string, invitedEmail: string, role: 'editor' | 'viewer', requesterId: string) {
    const ws = await this.findById(workspaceId);
    const requester = ws.members.find((m) => m.userId.toString() === requesterId);
    if (!requester || requester.role === 'viewer') throw new ForbiddenException();
    return ws;
  }

  async isMember(workspaceId: string, userId: string): Promise<boolean> {
    const ws = await this.workspaceModel.findOne({
      _id: new Types.ObjectId(workspaceId),
      'members.userId': new Types.ObjectId(userId),
    });
    return !!ws;
  }

  async getMemberRole(workspaceId: string, userId: string): Promise<string | null> {
    const ws = await this.workspaceModel.findById(workspaceId);
    const member = ws?.members.find((m) => m.userId.toString() === userId);
    return member?.role || null;
  }
}

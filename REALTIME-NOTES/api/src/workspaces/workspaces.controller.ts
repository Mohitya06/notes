import { Controller, Get, Post, Body, Param, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { WorkspacesService } from './workspaces.service';

@Controller('workspaces')
@UseGuards(JwtAuthGuard)
export class WorkspacesController {
  constructor(private workspacesService: WorkspacesService) {}

  @Post()
  create(@Body('name') name: string, @Req() req) {
    return this.workspacesService.create(name, req.user._id);
  }

  @Get()
  findAll(@Req() req) {
    return this.workspacesService.findByUser(req.user._id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.workspacesService.findById(id);
  }
}

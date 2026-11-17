import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PagesService } from './pages.service';

@Controller('pages')
@UseGuards(JwtAuthGuard)
export class PagesController {
  constructor(private pagesService: PagesService) {}

  @Post()
  create(
    @Body('workspaceId') workspaceId: string,
    @Body('parentPageId') parentPageId: string,
    @Req() req,
  ) {
    return this.pagesService.create(workspaceId, req.user._id, parentPageId);
  }

  @Get('workspace/:workspaceId')
  findByWorkspace(@Param('workspaceId') workspaceId: string) {
    return this.pagesService.findByWorkspace(workspaceId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.pagesService.findById(id);
  }

  @Patch(':id/title')
  updateTitle(@Param('id') id: string, @Body('title') title: string, @Req() req) {
    return this.pagesService.updateTitle(id, title, req.user._id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.pagesService.softDelete(id);
  }
}

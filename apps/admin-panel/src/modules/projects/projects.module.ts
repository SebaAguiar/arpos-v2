import { KanjijsModule } from '@kanjijs/core';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';

@KanjijsModule({
  controllers: [ProjectsController],
  providers: [ProjectsService],
  exports: [ProjectsService],
})
export class ProjectsModule {}

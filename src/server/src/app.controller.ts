import { Controller, Get, Req, Res } from '@nestjs/common';
import { AppService } from './app.service';
import next from 'next';
import { IncomingMessage, ServerResponse } from 'http';

type NextServer = ReturnType<typeof next>;

@Controller('/')
export class AppController {
  private server?: Promise<NextServer>;
  constructor(private readonly appService: AppService) {}

  public onModuleInit() {
    try {
      this.server = new Promise((resolve) => {
        (async () => {
          const server = next({
            dev: true,
            dir: './src/client',
            customServer: true,
          });
          await server.prepare();
          resolve(server);
        })();
      });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.log(error);
    }
  }

  @Get('*')
  async getNext(@Req() req: IncomingMessage, @Res() res: ServerResponse) {
    if (!this.server) {
      throw new Error("Next.js server hasn't inited");
    }
    const server = await this.server;
    const requestHandler = server.getRequestHandler();

    void requestHandler(req, res);
  }
}

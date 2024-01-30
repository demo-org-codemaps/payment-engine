import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { LogUtil } from '../../shared/index';
import { Request } from 'express';
@Injectable()
export class SlackBotService {
  private logger = new Logger(SlackBotService.name);
  private slackToken: string;
  constructor(private http: HttpService, private configService: ConfigService) {
    this.slackToken = this.configService.get('SLACK_OAUTH_TOKEN');
  }

  async postMessage(request: Request, exception: any) {
    try {
      this.logger.log('postMessage: ');
      const apiLog = LogUtil.getRequestData(request);
      const url = 'https://slack.com/api/chat.postMessage';
      // Multi-line code blocks
      const text = ` \`\`\` RequestPayload= ${apiLog.body} \`\`\`
      \`\`\` Headers= ${apiLog.headers} \`\`\`
      \`\`\` Exception= ${JSON.stringify(exception)} \`\`\`
      \`\`\` Stack Trace= ${JSON.stringify(exception.stack)} \`\`\` `;

      await firstValueFrom(
        this.http.post(
          url,
          {
            channel: '#', // add slack channel name here i.e. '#test'
            text, // <!channel> <@name>, // <> are used for linking
            username: 'Boilerplate App',
            icon_emoji: ':alert:',
            attachments: [
              {
                color: '#ff0000', // color of the sidebar.
                fields: [
                  {
                    title: 'Environment',
                    value: this.configService.get('NODE_ENV'),
                    short: true,
                  },
                  {
                    title: 'Method',
                    value: apiLog.method,
                    short: true,
                  },
                  {
                    title: 'URL',
                    value: apiLog.url,
                    short: true,
                  },
                  {
                    title: 'Request ID',
                    value: apiLog.requestId,
                    short: true,
                  },
                  {
                    title: 'IP',
                    value: apiLog.ip,
                    short: true,
                  },
                  {
                    title: 'Host',
                    value: apiLog.host,
                    short: true,
                  },
                ],
              },
            ],
          },
          { headers: { authorization: `Bearer ${this.slackToken}` } }
        )
      );
    } catch (error) {
      this.logger.error(`error sending slack message  ${error}`);
    }
  }
}

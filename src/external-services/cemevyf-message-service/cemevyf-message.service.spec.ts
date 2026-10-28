import { of, throwError } from 'rxjs';
import config from 'config';
import { CemevyfMessageService } from './cemevyf-message.service';

const serviceConfig = config.get<{ messageServiceUrl: string }>('serviceConfig');

describe('CemevyfMessageService', () => {
  const message = { to: 'a@b.com', subject: 'subject', context: {} };
  let httpService: { post: jest.Mock };
  let service: CemevyfMessageService;

  beforeEach(() => {
    httpService = { post: jest.fn() };
    service = new CemevyfMessageService(httpService as any);
  });

  it('posts the message and returns true', async () => {
    httpService.post.mockReturnValue(of({ data: 'ok' }));

    await expect(service.sendMail(message)).resolves.toBe(true);
    expect(httpService.post).toHaveBeenCalledWith(`${serviceConfig.messageServiceUrl}/message`, message);
  });

  it('returns false when the message service fails', async () => {
    httpService.post.mockReturnValue(throwError(() => new Error('down')));

    await expect(service.sendMail(message)).resolves.toBe(false);
  });
});

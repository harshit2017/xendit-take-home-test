import { TranslationService } from '../../../src/services/translation.service';
import Translation from '../../../src/models/translation.model';
import { TranslationCategory } from '../../../src/types/i18n.types';
import { SupportedLanguage } from '../../../src/types/localization.types';

jest.mock('../../../src/models/translation.model');

describe('TranslationService', () => {
  let service: TranslationService;

  beforeEach(() => {
    service = new TranslationService();
    jest.clearAllMocks();
  });

  it('upserts system message translations', async () => {
    (Translation.findOneAndUpdate as jest.Mock).mockResolvedValue({
      category: TranslationCategory.ERROR_MESSAGE,
      key: 'order.not_found',
      locale: SupportedLanguage.EN,
      value: 'Order not found',
    });

    const result = await service.upsertTranslation({
      category: TranslationCategory.ERROR_MESSAGE,
      key: 'order.not_found',
      locale: SupportedLanguage.EN,
      value: 'Order not found',
    });

    expect(result.value).toBe('Order not found');
  });

  it('returns all messages for locale with fallback', async () => {
    (Translation.find as jest.Mock).mockReturnValue({
      sort: jest.fn().mockResolvedValue([
        {
          category: TranslationCategory.ERROR_MESSAGE,
          key: 'order.not_found',
          locale: SupportedLanguage.EN,
          value: 'Order not found',
        },
        {
          category: TranslationCategory.SUCCESS_MESSAGE,
          key: 'order.created',
          locale: SupportedLanguage.ID,
          value: 'Pesanan dibuat',
        },
      ]),
    });

    const messages = await service.getMessagesForLocale(SupportedLanguage.ID);

    expect(messages['error_message.order.not_found']).toBe('Order not found');
    expect(messages['success_message.order.created']).toBe('Pesanan dibuat');
  });
});

import { resolveLanguage, parseAcceptLanguage } from '../../../src/utils/language.utils';
import { SupportedLanguage } from '../../../src/types/localization.types';

describe('language.utils', () => {
  it('prioritizes explicit language over account and browser', () => {
    const language = resolveLanguage({
      explicitLanguage: 'id',
      accountLanguage: 'en',
      acceptLanguageHeader: 'fr-FR,fr;q=0.9',
      countryCode: 'US',
    });

    expect(language).toBe(SupportedLanguage.ID);
  });

  it('falls back through account, browser, geo, and default', () => {
    expect(
      resolveLanguage({
        accountLanguage: 'es',
        acceptLanguageHeader: 'fr-FR,fr;q=0.9',
        countryCode: 'ID',
      })
    ).toBe(SupportedLanguage.ES);

    expect(
      resolveLanguage({
        acceptLanguageHeader: 'fr-FR,fr;q=0.9',
        countryCode: 'ID',
      })
    ).toBe(SupportedLanguage.FR);

    expect(resolveLanguage({ countryCode: 'ID' })).toBe(SupportedLanguage.ID);
    expect(resolveLanguage({})).toBe(SupportedLanguage.EN);
  });

  it('parses accept-language header', () => {
    expect(parseAcceptLanguage('id-ID,id;q=0.9,en;q=0.8')).toBe(SupportedLanguage.ID);
  });
});

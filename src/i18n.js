import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import es from './locales/es.json';
import de from './locales/de.json';
import ar from './locales/ar.json';
import ur from './locales/ur.json';
import fr from './locales/fr.json';
import it from './locales/it.json';
import nl from './locales/nl.json';
import pt from './locales/pt.json';
import ru from './locales/ru.json';
import tr from './locales/tr.json';
import pl from './locales/pl.json';
import el from './locales/el.json';
import sv from './locales/sv.json';
import no from './locales/no.json';
import da from './locales/da.json';
import fi from './locales/fi.json';
import ro from './locales/ro.json';
import cs from './locales/cs.json';
import hu from './locales/hu.json';
import uk from './locales/uk.json';
import bg from './locales/bg.json';
import sr from './locales/sr.json';
import hi from './locales/hi.json';
import bn from './locales/bn.json';
import id from './locales/id.json';
import ms from './locales/ms.json';
import th from './locales/th.json';
import vi from './locales/vi.json';

export const rtlLanguages = ['ar', 'ur'];

const resources = {
  en: { translation: en },
  es: { translation: es },
  de: { translation: de },
  ar: { translation: ar },
  ur: { translation: ur },
  fr: { translation: fr },
  it: { translation: it },
  nl: { translation: nl },
  pt: { translation: pt },
  ru: { translation: ru },
  tr: { translation: tr },
  pl: { translation: pl },
  el: { translation: el },
  sv: { translation: sv },
  no: { translation: no },
  da: { translation: da },
  fi: { translation: fi },
  ro: { translation: ro },
  cs: { translation: cs },
  hu: { translation: hu },
  uk: { translation: uk },
  bg: { translation: bg },
  sr: { translation: sr },
  hi: { translation: hi },
  bn: { translation: bn },
  id: { translation: id },
  ms: { translation: ms },
  th: { translation: th },
  vi: { translation: vi }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

const applyDirection = (lng) => {
  const dir = rtlLanguages.includes(lng) ? 'rtl' : 'ltr';
  if (typeof document !== 'undefined') {
    document.documentElement.dir = dir;
    document.documentElement.lang = lng;
  }
};

applyDirection(i18n.language);

i18n.on('languageChanged', (lng) => {
  applyDirection(lng);
});

export default i18n;

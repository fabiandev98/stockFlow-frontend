import { computed, navigateTo, useSwitchLocalePath } from "#imports";
import type { DropdownMenuItem } from "@nuxt/ui";
import { LOCALES, type I18nLocaleCode } from "~~/i18n/i18n";

export default function useLynxLocaleSwitcher(): DropdownMenuItem[] {
  const switcher = useSwitchLocalePath();

  const AVAILABLE_LOCALES = computed<DropdownMenuItem[]>(() => {
    return (Object.keys(LOCALES) as I18nLocaleCode[]).map<DropdownMenuItem>(
      (locale) => ({
        label: LOCALES[locale].name,
        onSelect: () => navigateTo(switcher(locale)),
      })
    );
  });

  return AVAILABLE_LOCALES.value;
}

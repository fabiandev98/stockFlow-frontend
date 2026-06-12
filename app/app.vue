<script setup lang="ts">
import { useLocaleHead } from "#imports";

// Info directly taken from: https://i18n.nuxtjs.org/docs/guide/seo#requirements
const i18nHead = useLocaleHead();
</script>
<template>
  <UApp>
    <Head>
      <template v-for="link in i18nHead.link" :key="link.key">
        <Link
          :id="link.key"
          :rel="link.rel"
          :href="link.href"
          :hreflang="link.hreflang"
        />
      </template>
      <template v-for="meta in i18nHead.meta" :key="meta.key">
        <Meta
          :id="meta.key"
          :property="meta.property"
          :content="meta.content"
        />
      </template>
    </Head>
    <NuxtLoadingIndicator />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>

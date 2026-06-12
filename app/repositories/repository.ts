import { useNuxtApp } from "#app";

export abstract class Repository {
  protected api: typeof $fetch;

  constructor() {
    this.api = useNuxtApp().$api;
  }
}

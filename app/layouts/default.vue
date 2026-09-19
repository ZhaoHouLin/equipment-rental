<script setup>
import { NConfigProvider, NMessageProvider, NDialogProvider, NButton, zhTW, dateZhTW } from "naive-ui"

const catalog = useCatalogStore()
const auth = useAuthStore()
const route = useRoute()

const themeOverrides = {
  common: {
    primaryColor: "rgb(54, 79, 199)",
    primaryColorHover: "rgb(74, 99, 219)",
    primaryColorPressed: "rgb(34, 59, 179)",
  },
}

onMounted(() => catalog.load())
</script>

<template lang="pug">
NConfigProvider(:theme-overrides="themeOverrides" :locale="zhTW" :date-locale="dateZhTW")
  NDialogProvider
    NMessageProvider
      .app
        header.topbar
          NuxtLink.brand(to="/") {{ catalog.settings.orgName }}
          nav
            NuxtLink(to="/") 借用
            NuxtLink(v-if="auth.loggedIn" to="/management") 管理
            a(v-if="auth.loggedIn" @click="auth.logout") 登出（{{ auth.user }}）
            NuxtLink(v-else-if="route.path !== '/login'" to="/login") 管理員登入
        main
          NuxtPage
</template>

<style lang="stylus">
.app
  min-height 100vh
  flex(,stretch,column)
  background linear-gradient(135deg, color_secondary, color_tertiary 60%)

.topbar
  flex(space-between)
  padding 0.75rem 1.25rem
  background-color rgba(255,255,255,0.9)
  border-bottom 1px solid rgba(0,0,0,0.08)
  .brand
    font-weight 900
    font-size 1.1rem
    color color_primary
    text-decoration none
  nav
    flex()
    gap 1rem
    a
      color color_secondary
      text-decoration none
      cursor pointer
      font-weight 700

main
  flex 1
  flex(,flex-start)
  padding 1.5rem 1rem

.page-enter-active,
.page-leave-active
  transition all 0.3s

.page-enter-from,
.page-leave-to
  opacity 0
</style>

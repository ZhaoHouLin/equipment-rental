<script setup>
import { NCard, NInput, NButton } from "naive-ui"

definePageMeta({ middleware: "guest" })

const auth = useAuthStore()
const username = ref("")
const password = ref("")
const message = ref("")
const loading = ref(false)

const login = async () => {
  loading.value = true
  message.value = ""
  try {
    await auth.login(username.value, password.value)
    await navigateTo("/management")
  } catch (err) {
    message.value = err.data?.message || "登入失敗"
  } finally {
    loading.value = false
  }
}
</script>

<template lang="pug">
.login
  NCard(title="管理員登入")
    NInput(v-model:value="username" placeholder="帳號" style="margin-bottom: 10px;" @keyup.enter="login")
    NInput(v-model:value="password" placeholder="密碼" type="password" show-password-on="mousedown" style="margin-bottom: 10px;" @keyup.enter="login")
    NButton(type="primary" block :loading="loading" @click="login") 登入
    p.message(v-if="message") {{ message }}
</template>

<style lang="stylus" scoped>
.login
  size(320px,auto)
  margin 3rem auto
.message
  margin-top 10px
  color #ff004c
  text-align center
</style>

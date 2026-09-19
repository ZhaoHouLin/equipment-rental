<script setup>
defineProps({
  error: Object,
})

const handleError = () => clearError({ redirect: "/" })
</script>

<template lang="pug">
.error-page
  button(type="button" @click="handleError") 清除錯誤後回到首頁
  p {{ error.message }}
  h1 {{ error.statusCode }}
</template>

<style lang="stylus" scoped>
.error-page
  size()
  flex(,,column-reverse)
  pos()
  transform translate(-50%,-50%)
  color color_secondary
  background-color color_tertiary
  h1
    font-size 10rem
    text-shadow 4px 4px 4px color_secondary
    transition .5s
  p
    text-align center
    font-size 3rem
    margin 1rem
  button
    // text-decoration none
    background none
    border none
    font-size 1.2rem
    padding 0.8rem
    margin 1rem
    border-radius 1rem
    // border 1px solid color_secondary
    box-shadow 4px 4px 12px color_secondary
    color color_secondary
    font-weight 900
    transition .5s
    cursor pointer
    &:hover
      box-shadow none
      ~ h1
        text-shadow none
</style>

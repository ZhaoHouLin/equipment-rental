<script setup>
import { NForm, NFormItem, NButton, NDatePicker, useMessage } from "naive-ui"

const message = useMessage()
const form = useFormStore()

const next = () => {
  const [a, b] = form.model.range ?? []
  if (!a || !b || b < a) return message.error("請選擇借用與歸還時間")
  form.next()
}
</script>

<template lang="pug">
NForm(label-placement="top")
  NFormItem(label="借用時間 → 預計歸還時間")
    NDatePicker(v-model:value="form.model.range" type="datetimerange" start-placeholder="借用時間" end-placeholder="歸還時間" clearable style="width: 100%")
  .btn
    NButton(size="large" @click="form.prev") 上一步
    NButton(type="primary" size="large" @click="next") 下一步
</template>

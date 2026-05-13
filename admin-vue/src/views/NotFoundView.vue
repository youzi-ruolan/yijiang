<script setup lang="ts">
import { useRouter } from 'vue-router';

const router = useRouter();

function goHome() {
  router.replace('/dashboard');
}
</script>

<template>
  <div class="not-found-page admin-card">
    <div class="not-found-code">404</div>
    <h1>页面不存在</h1>
    <p>这个地址暂时还没有对应页面，我们先回到后台首页继续工作吧。</p>
    <t-button theme="primary" @click="goHome">返回项目总览</t-button>
  </div>
</template>

<style scoped>
.not-found-page {
  min-height: calc(100vh - 180px);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: 14px;
  padding: 32px;
}

.not-found-code {
  font-size: 72px;
  font-weight: 700;
  color: var(--admin-primary);
  line-height: 1;
}

h1 {
  margin: 0;
  font-size: 28px;
}

p {
  margin: 0;
  max-width: 420px;
  color: var(--admin-text-soft);
  line-height: 1.8;
}
</style>

<script setup lang="ts">
import { reactive } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { MessagePlugin } from 'tdesign-vue-next';
import { DEFAULT_LOGIN } from '@/constants/auth';
import { useAuthStore } from '@/stores/auth';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

const form = reactive({
  username: DEFAULT_LOGIN.username,
  password: DEFAULT_LOGIN.password,
});

async function submit() {
  try {
    const result = await authStore.login(form);
    MessagePlugin.success(result.message);
    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/dashboard';
    router.replace(redirect);
  } catch (error) {
    MessagePlugin.error(error instanceof Error ? error.message : '登录失败');
  }
}
</script>

<template>
  <div class="login-page">
    <div class="login-bg"></div>

    <div class="login-shell">
      <div class="login-top-brand">
        <div class="login-brand__mark">匠</div>
        <div>
          <div class="login-brand__title">艺匠调色</div>
          <div class="login-brand__subtitle">艺匠调色管理后台</div>
        </div>
      </div>

      <section class="login-card">
        <div class="login-card__head">
          <div>
            <div class="login-card__eyebrow">欢迎回来</div>
            <h1>登录后台</h1>
          </div>
        </div>

        <t-form class="login-form" layout="vertical" @submit.prevent="submit">
          <t-form-item label="账号">
            <t-input v-model="form.username" placeholder="请输入账号" size="large" />
          </t-form-item>
          <t-form-item label="密码">
            <t-input v-model="form.password" type="password" placeholder="请输入密码" size="large" />
          </t-form-item>
          <t-button class="login-submit" theme="primary" block size="large" @click="submit">
            登录后台
          </t-button>
        </t-form>

        <div class="login-helper">
          <span>默认账号：{{ DEFAULT_LOGIN.username }}</span>
          <span>默认密码：{{ DEFAULT_LOGIN.password }}</span>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.login-page {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 24px;
  position: relative;
  overflow: hidden;
  background: linear-gradient(135deg, #fff8f2 0%, #f7f2eb 52%, #f5efe8 100%);
}

.login-bg {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 16% 18%, rgba(255, 121, 103, 0.15) 0, transparent 24%),
    radial-gradient(circle at 82% 14%, rgba(255, 191, 160, 0.2) 0, transparent 18%),
    radial-gradient(circle at 76% 82%, rgba(255, 147, 115, 0.12) 0, transparent 24%);
}

.login-shell {
  position: relative;
  z-index: 1;
  width: min(460px, 100%);
}

.login-top-brand {
  margin-bottom: 18px;
  display: flex;
  align-items: center;
  gap: 14px;
  justify-content: center;
}

.login-brand__mark {
  width: 56px;
  height: 56px;
  border-radius: 20px;
  display: grid;
  place-items: center;
  color: #fff;
  font-size: 24px;
  font-weight: 700;
  background: linear-gradient(135deg, #ff8d78 0%, #ff6d61 100%);
  box-shadow: 0 18px 34px rgba(255, 109, 97, 0.24);
}

.login-brand__title {
  font-size: 24px;
  font-weight: 700;
}

.login-brand__subtitle {
  margin-top: 4px;
  color: var(--admin-text-soft);
  font-size: 13px;
}

.login-card {
  width: 100%;
  padding: 32px;
  border-radius: 30px;
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid rgba(239, 228, 218, 0.82);
  box-shadow: 0 26px 70px rgba(110, 80, 55, 0.12);
  backdrop-filter: blur(14px);
}

.login-card__head {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: flex-start;
}

.login-card__eyebrow {
  color: var(--admin-text-soft);
  font-size: 13px;
}

.login-card__head h1 {
  margin: 8px 0 0;
  font-size: 34px;
}

.login-form {
  margin-top: 28px;
}

.login-submit {
  margin-top: 8px;
  height: 48px;
  border: 0;
  border-radius: 14px;
  background: linear-gradient(135deg, #ff8d78 0%, #ff6d61 100%) !important;
  box-shadow: 0 16px 32px rgba(255, 109, 97, 0.22);
}

.login-submit:hover {
  opacity: 0.96;
}

.login-helper {
  margin-top: 18px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 14px 16px;
  border-radius: 18px;
  background: linear-gradient(180deg, #fff7f3 0%, #fff2ec 100%);
  color: var(--admin-text-soft);
  font-size: 13px;
  line-height: 1.7;
}

:deep(.t-form__label) {
  color: #5d4d41;
  font-weight: 600;
}

:deep(.t-input__wrap) {
  border-radius: 14px;
}

:deep(.t-input__inner) {
  font-size: 15px;
}

@media (max-width: 640px) {
  .login-page {
    padding: 18px;
  }

  .login-top-brand {
    justify-content: flex-start;
  }

  .login-card {
    padding: 24px;
    border-radius: 24px;
  }

  .login-card__head h1 {
    font-size: 28px;
  }
}
</style>

<script setup lang="ts">
import { reactive } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
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
    ElMessage.success(result.message);
    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/dashboard';
    router.replace(redirect);
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '登录失败');
  }
}
</script>

<template>
  <div class="login-page">
    <div class="login-shell">
      <div class="login-top-brand">
        <div class="login-brand__mark">匠</div>
        <div>
          <div class="login-brand__title">艺匠调色</div>
          <div class="login-brand__subtitle">管理后台</div>
        </div>
      </div>

      <section class="login-card">
        <div class="login-card__head">
          <h1>登录后台</h1>
          <p>欢迎回来，请输入账号密码</p>
        </div>

        <el-form class="login-form" label-position="top" @submit.prevent="submit">
          <el-form-item label="账号">
            <el-input v-model="form.username" placeholder="请输入账号" size="large" />
          </el-form-item>
          <el-form-item label="密码">
            <el-input v-model="form.password" type="password" placeholder="请输入密码" size="large" show-password />
          </el-form-item>
          <el-button class="login-submit" type="primary" size="large" @click="submit">登录后台</el-button>
        </el-form>

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
  background: linear-gradient(160deg, #e6f4ff 0%, #f0f7ff 50%, #f8fbff 100%);
}

.login-shell {
  width: min(400px, 100%);
}

.login-top-brand {
  margin-bottom: 24px;
  display: flex;
  align-items: center;
  gap: 14px;
  justify-content: center;
}

.login-brand__mark {
  width: 48px;
  height: 48px;
  border-radius: 10px;
  display: grid;
  place-items: center;
  color: #fff;
  font-size: 22px;
  font-weight: 700;
  background: linear-gradient(135deg, #40a9ff 0%, #1890ff 100%);
}

.login-brand__title {
  font-size: 22px;
  font-weight: 600;
  color: var(--admin-text);
}

.login-brand__subtitle {
  margin-top: 2px;
  color: var(--admin-text-soft);
  font-size: 13px;
}

.login-card {
  width: 100%;
  padding: 32px;
  border-radius: var(--admin-radius-lg);
  background: #ffffff;
  border: 1px solid var(--admin-line);
  box-shadow: var(--admin-shadow);
}

.login-card__head h1 {
  margin: 0;
  font-size: 22px;
  font-weight: 600;
}

.login-card__head p {
  margin: 8px 0 0;
  color: var(--admin-text-soft);
  font-size: 14px;
}

.login-form {
  margin-top: 24px;
}

.login-submit {
  width: 100%;
  margin-top: 8px;
}

.login-helper {
  margin-top: 20px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 12px 14px;
  border-radius: var(--admin-radius-md);
  background: var(--admin-primary-soft);
  color: var(--admin-text-soft);
  font-size: 13px;
  line-height: 1.6;
}

@media (max-width: 640px) {
  .login-page {
    padding: 16px;
  }

  .login-card {
    padding: 24px;
  }
}
</style>

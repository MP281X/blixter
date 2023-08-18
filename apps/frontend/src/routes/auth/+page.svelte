<script lang="ts">
	export let data;
</script>

<form action="?/login" method="post" class="flex flex-col space-y-2 h-[100dvh] w-full bg-primary justify-center items-center">
	<input type="text" placeholder={data.loginSchema.username} name={data.loginSchema.username} />
	<input type="password" placeholder={data.loginSchema.password} name={data.loginSchema.password} />
	<button type="submit" class="bg-secondary px-14 py-1">Login</button>
</form>

<form action="?/signup" method="post" class="flex flex-col space-y-2 h-[100dvh] w-full bg-primary justify-center items-center">
	<input type="text" placeholder={data.signupSchema.username} name={data.signupSchema.username} />
	<input type="text" placeholder={data.signupSchema.email} name={data.signupSchema.email} />
	<input type="password" placeholder={data.signupSchema.password} name={data.signupSchema.password} />
	<button type="submit" class="bg-secondary px-14 py-1">SignUp</button>
</form>

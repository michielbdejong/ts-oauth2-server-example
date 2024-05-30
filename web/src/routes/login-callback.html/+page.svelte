<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { get } from 'svelte/store';
  import { handleRedirectCallback } from '$lib/oidc';
  
  onMount(async () => {
    await handleRedirectCallback();
    // goto('/');
  });
</script>
  
  Welcome back from the OIDC provider!
  
<script lang="ts">
  import { onMount } from "svelte";

  const url = new URL("https://sram-auth-poc.pondersource.net/api/oidc");

  onMount(async () => {
    window.location.replace(url + window.location.search);
  });
</script>

Redirecting to login...

<a href={url}>{url}</a>

<script>
  import interact from "interactjs";
  import { onMount } from "svelte";
  let content =
    "Click on a word component to find its meaning. Learn the word components for the exercises that follow by repeatedly checking their meaning:";
  let height = "18";
  let source = [
    ["Removal of", "-ectomy"],
    ["Inflammation of", "-itis"],
    ["Incision into", "-tomy"],
    ["Study of", "-logy"],
    ["Instrument to view", "-scope"],
    ["Protrusion/Hernia", "-cele"],
    ["Disease of", "-pathy"],
    ["An opening into", "-stomy"]
  ];
  const reset = () => {
    blurs = Object.fromEntries(source.map(s => [s[1], true]));
  };
  onMount(() => {
    height = "0";
    setTimeout(() => (height = `${title.scrollHeight}px`), 0);
  });
  let suffixes = source.map(s => s[1]);
  let blurs = Object.fromEntries(source.map(s => [s[1], true]));
  let title;
  let preview = false;
</script>

<div class="block">
  <div class="content">
    <textarea
      rows="1"
      class="h2"
      bind:this={title}
      bind:value={content}
      placeholder="Title..."
      on:input={e => {
        height = '0px';
        setTimeout(() => (height = `${e.target.scrollHeight}px`), 0);
      }}
      style={`height:${height}`} />

    <div class="answers">
      {#each source as answer}
        <div
          class="box dropzone pointer {blurs[answer[1]] && !preview ? 'blur' : ''}"
          id="box{answer[1]}"
          on:click={() => (blurs[answer[1]] = !blurs[answer[1]])}>
          <h3 class="subtitle">{answer[1]}</h3>
          <p class="match">{answer[0]}</p>
        </div>
      {/each}
    </div>
    <div class="controls">
      <button class="reset" on:click={reset}>Reset</button>
      <button class="show-answers" on:click={() => (preview = !preview)}>
        {preview ? 'Hide answers' : 'Show answers'}
      </button>
    </div>
  </div>
</div>

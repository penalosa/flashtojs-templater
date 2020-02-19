<script>
  import interact from "interactjs";
  import { onMount } from "svelte";
  let content =
    "Build words relating to the esophagus by dragging an appropriate suffix into a medical term box:";
  let height = "18";
  let source = [
    ["Removal of the esophagus", "Esophag-", "-ectomy"],
    ["Inflammation of the esophagus", "Esophag-", "-itis"],
    ["Incision into the esophagus", "Esophago-", "-tomy"],
    ["Instrument to view the esophagus", "Esophago-", "-scope"],
    ["Protrusion/Hernia of the esophagus", "Esophago-", "-cele"],
    ["Disease of the esophagus", "Esophago-", "-pathy"],
    ["Opening into the esophagus", "Esophago-", "-stomy"]
  ];

  let suffixes = source.map(s => s[2]);
  $: els = Object.fromEntries(suffixes.map(s => [s, null]));
  $: elsOffset = Object.fromEntries(suffixes.map(s => [s, { x: 0, y: 0 }]));
  let dropzoneClasses = Object.fromEntries(suffixes.map(s => [s, []]));
  let dropzoneComplete = Object.fromEntries(suffixes.map(s => [s, false]));
  const reset = () => {
    suffixes = source.map(s => s[2]);
    dropzoneClasses = Object.fromEntries(suffixes.map(s => [s, []]));
    dropzoneComplete = Object.fromEntries(suffixes.map(s => [s, false]));
  };
  onMount(() => {
    interact(".draggable").draggable({
      //   inertia: true,
      autoScroll: true,
      listeners: {
        start(event) {
          console.log(event.type, event.target);
          event.target.style.transition = "";
        },
        move(event) {
          const suffix = event.target.id;
          elsOffset[suffix].x += event.dx;
          elsOffset[suffix].y += event.dy;
        },
        end(event) {
          if (event.target) {
            const suffix = event.target.id;
            event.target.style.transition = "transform 0.2s";
            elsOffset[suffix].x = 0;
            elsOffset[suffix].y = 0;
          }
        }
      }
    });
    interact(".dropzone").dropzone({
      accept: ".draggable",
      overlap: 0.75,
      ondragenter: function(event) {
        const suffix = "-" + event.target.id.split("-")[1];
        console.log(suffix);
        if (!dropzoneComplete[suffix]) {
          dropzoneClasses[suffix] = ["drop-active"];
        }

        console.log(dropzoneClasses);
      },

      ondragleave: function(event) {
        const suffix = "-" + event.target.id.split("-")[1];
        if (!dropzoneComplete[suffix]) {
          dropzoneClasses[suffix] = [];
        }
      },
      ondrop: function(event) {
        const suffix = "-" + event.target.id.split("-")[1];
        if (!dropzoneComplete[suffix]) {
          if (suffix == event.relatedTarget.id) {
            suffixes = suffixes.filter(s => s != suffix);
            dropzoneClasses[suffix] = ["success"];
            dropzoneComplete[suffix] = true;
          } else {
            dropzoneClasses[suffix] = ["wrong"];
            setTimeout(() => (dropzoneClasses[suffix] = []), 1000);
          }
        }
      }
    });
    height = "0";
    setTimeout(() => (height = `${title.scrollHeight}px`), 0);
  });
  let title;
  let preview = false;
</script>

<style>
  .draggable {
    touch-action: none;
    user-select: none;
  }
  .drop-active {
    background: #29e;
  }
</style>

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
    <div class="spacing">
      {#if !preview}
        {#each suffixes as suffix}
          <span
            id={suffix}
            style="transform: translate({elsOffset[suffix].x}px, {elsOffset[suffix].y}px)"
            class="suffix draggable"
            bind:this={els[suffix]}
            draggable="true"
            on:dragstart={e => {
              e.dataTransfer.setData('text/plain', suffix);
            }}>
            {suffix}
          </span>
        {/each}
        {#if suffixes.length == 0}
          <img class="party" src="/party.svg" />
          <h3>All done!</h3>
        {/if}
      {/if}
    </div>
    <div class="answers">
      {#each source as answer}
        <div
          class={`box dropzone ${dropzoneClasses[answer[2]].join(' ')}`}
          id="box{answer[2]}">
          <h3 class="subtitle">{answer[0]}</h3>
          <p class="match">
            {dropzoneComplete[answer[2]] || preview ? answer[1].slice(0, -1) + answer[2].slice(1) : answer[1]}
          </p>
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

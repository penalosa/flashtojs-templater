<script>
  import Button from "@smui/button";
  import TopAppBar, {
    Row,
    Section,
    Title,
    FixedAdjust
  } from "@smui/top-app-bar";
  import Tab, { Icon, Label } from "@smui/tab";
  import TabBar from "@smui/tab-bar";
  import IconButton from "@smui/icon-button";
  import Checkbox from "@smui/checkbox";
  import FormField from "@smui/form-field";
  import Dictionary from "./Dictionary.svelte";
  import WordComponents from "./WordComponents.svelte";
  const builders = [Dictionary, WordComponents];
  let active = 1;
  let tabs = [`Dictionary`, `Word Components`];
</script>

<style>
  .grayed {
    opacity: 0.6;
  }
</style>

<TopAppBar variant="fixed" color="primary">
  <Row>
    <Section>
      <Title>Flash to JS</Title>
    </Section>
    <!-- <Section align="end" toolbar>
      <IconButton class="material-icons" aria-label="Download">
        file_download
      </IconButton>
      <IconButton class="material-icons" aria-label="Print this page">
        print
      </IconButton>
      <IconButton class="material-icons" aria-label="Bookmark this page">
        bookmark
      </IconButton>
    </Section> -->
  </Row>
</TopAppBar>
<div class="container" use:FixedAdjust>
  <TabBar tabs={[1, 2]} let:tab bind:active>
    <Tab {tab}>
      <Label>{tabs[tab - 1]}</Label>
    </Tab>
  </TabBar>
  <svelte:component this={builders[active - 1]} />
</div>

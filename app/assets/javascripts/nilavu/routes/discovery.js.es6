
//  The parent route for all discovery routes.
//  Handles the logic for showing the loading spinners.
import OpenComposer from "nilavu/mixins/open-composer";
import { scrollTop } from "nilavu/mixins/scroll-top";

export default Nilavu.Route.extend(OpenComposer, {

  redirect() {
    console.log(">  discovery, redirectIfLoginRequired...");
    return this.redirectIfLoginRequired();
  },

  beforeModel(transition) {
    console.log("   discovery beforeModel url="+ transition.intent.url + "targetName ="+transition.targetName + ","  + Nilavu.User.currentProp("should_be_redirected_to_top"));
    if (transition.intent.url === "/" &&
        transition.targetName.indexOf("discovery.top") === -1 &&
        Nilavu.User.currentProp("should_be_redirected_to_top")) {
      Nilavu.User.currentProp("should_be_redirected_to_top", false);
      const period = Nilavu.User.currentProp("redirect_to_top.period") || "all";
      this.replaceWith(`discovery.top${period.capitalize()}`);
    }
  },

  actions: {
    loading() {
      this.controllerFor("discovery").set("loading", true);
      return true;
    },

    loadingComplete() {
      this.controllerFor("discovery").set("loading", false);
      if (!this.session.get("topicListScrollPosition")) {
        scrollTop();
      }
    },

    didTransition() {
      this.controllerFor("discovery")._showFooter();
      this.send("loadingComplete");
      return true;
    },

    // clear a pinned topic
    clearPin(topic) {
      topic.clearPin();
    },

    createTopic() {
      this.openComposer(this.controllerFor("discovery/topics"));
    },

    dismissReadTopics(dismissTopics) {
      var operationType = dismissTopics ? "topics" : "posts";
      this.controllerFor("discovery/topics").send('dismissRead', operationType);
    },

    dismissRead(operationType) {
      this.controllerFor("discovery/topics").send('dismissRead', operationType);
    }
  }

});

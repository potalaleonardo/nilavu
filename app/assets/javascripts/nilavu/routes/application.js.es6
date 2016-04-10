import { setting } from 'nilavu/lib/computed';
import logout from 'nilavu/lib/logout';
import showModal from 'nilavu/lib/show-modal';
import OpenComposer from "nilavu/mixins/open-composer";
import Category from 'nilavu/models/category';

function unlessReadOnly(method, message) {
  return function() {
    if (this.site.get("isReadOnly")) {
      bootbox.alert(message);
    } else {
      this[method]();
    }
  };
}

const ApplicationRoute = Nilavu.Route.extend(OpenComposer, {
  siteTitle: setting('title'),

  _handleLogout() {
    if (this.currentUser) {
      this.currentUser.destroySession().then(() => logout(this.siteSettings, this.keyValueStore));
    }
  },

  afterModel: function() {
   $('#apploading').remove();
  },

  actions: {

    logout: unlessReadOnly('_handleLogout', I18n.t("read_only_mode.logout_disabled")),

    _collectTitleTokens(tokens) {
      tokens.push(this.get('siteTitle'));
      Nilavu.set('_docTitle', tokens.join(' - '));
    },

    // Ember doesn't provider a router `willTransition` event so let's make one
    willTransition() {
      var router = this.container.lookup('router:main');
      Ember.run.once(router, router.trigger, 'willTransition');
      return this._super();
    },

    showTopicEntrance(data) {
      this.controllerFor('topic-entrance').send('show', data);
    },

    postWasEnqueued(details) {
      const title = details.reason ? 'queue_reason.' + details.reason + '.title' : 'queue.approval.title';
      showModal('post-enqueued', {model: details, title });
    },

    composePrivateMessage(user, post) {

      const recipient = user ? user.get('username') : '',
          reply = post ? window.location.protocol + "//" + window.location.host + post.get("url") : null;

      // used only once, one less dependency
      const Composer = require('nilavu/models/composer').default;
      return this.controllerFor('composer').open({
        action: Composer.PRIVATE_MESSAGE,
        usernames: recipient,
        archetypeId: 'private_message',
        draftKey: 'new_private_message',
        reply: reply
      });
    },

    error(err, transition) {
      let xhr = {};
      if (err.jqXHR) {
        xhr = err.jqXHR;
      }

      const xhrOrErr = err.jqXHR ? xhr : err;

      const exceptionController = this.controllerFor('exception');

      const c = window.console;
      if (c && c.error) {
        c.error(xhrOrErr);
      }

      exceptionController.setProperties({ lastTransition: transition, thrown: xhrOrErr });

      this.intermediateTransitionTo('exception');
      return true;
    },

    showLogin: unlessReadOnly('handleShowLogin', I18n.t("read_only_mode.login_disabled")),

    showCreateAccount: unlessReadOnly('handleShowCreateAccount', I18n.t("read_only_mode.login_disabled")),

    showForgotPassword() {
      showModal('forgotPassword', { title: 'forgot_password.title' });
    },

    showNotActivated(props) {
      showModal('not-activated', {title: 'log_in' }).setProperties(props);
    },

    showUploadSelector(toolbarEvent) {
      showModal('uploadSelector').setProperties({ toolbarEvent, imageUrl: null, imageLink: null });
    },

    showKeyboardShortcutsHelp() {
      showModal('keyboard-shortcuts-help', { title: 'keyboard_shortcuts_help.title'});
    },

    // Close the current modal, and destroy its state.
    closeModal() {
      this.render('hide-modal', { into: 'modal', outlet: 'modalBody' });
    },

    /**
      Hide the modal, but keep it with all its state so that it can be shown again later.
      This is useful if you want to prompt for confirmation. hideModal, ask "Are you sure?",
      user clicks "No", reopenModal. If user clicks "Yes", be sure to call closeModal.
    **/
    hideModal() {
      $('#discourse-modal').modal('hide');
    },

    reopenModal() {
      $('#discourse-modal').modal('show');
    },

    editCategory(category) {
      Category.reloadById(category.get('id')).then((atts) => {
        const model = this.store.createRecord('category', atts.category);
        model.setupGroupsAndPermissions();
        this.site.updateCategory(model);
        showModal('editCategory', { model });
        this.controllerFor('editCategory').set('selectedTab', 'general');
      });
    },

    deleteSpammer(user) {
      this.send('closeModal');
      user.deleteAsSpammer(function() { window.location.reload(); });
    },

    checkEmail(user) {
      user.checkEmail();
    },

    changeBulkTemplate(w) {
      const controllerName = w.replace('modal/', ''),
            factory = this.container.lookupFactory('controller:' + controllerName);

      this.render(w, {into: 'modal/topic-bulk-actions', outlet: 'bulkOutlet', controller: factory ? controllerName : 'topic-bulk-actions'});
    },

    createNewTopicViaParams(title, body, category_id, category) {
      this.openComposerWithTopicParams(this.controllerFor('discovery/topics'), title, body, category_id, category);
    },

    createNewMessageViaParams(username, title, body) {
      this.openComposerWithMessageParams(username, title, body);
    }
  },

  activate() {
    this._super();
    Em.run.next(function() {
      // Support for callbacks once the application has activated
      ApplicationRoute.trigger('activate');
    });
  },

  handleShowLogin() {
    this._autoLogin('login', 'login-modal', () => this.controllerFor('login').resetForm());
  },

  handleShowCreateAccount() {
    if (this.siteSettings.enable_sso) {
      const returnPath = encodeURIComponent(window.location.pathname);
      window.location = Nilavu.getURL('/session/sso?return_path=' + returnPath);
    } else {
      this._autoLogin('createAccount', 'create-account');
    }
  },

  _autoLogin(modal, modalClass, notAuto) {

    const methods = Em.get('Nilavu.LoginMethod.all');
    if (!this.siteSettings.enable_local_logins && methods.length === 1) {
      this.controllerFor('login').send('externalLogin', methods[0]);
    } else {
      this.render(modal, { into: 'application' });
      if (notAuto) { notAuto(); }
    }
  },

});

RSVP.EventTarget.mixin(ApplicationRoute);
export default ApplicationRoute;

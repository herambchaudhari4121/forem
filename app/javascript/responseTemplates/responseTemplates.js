/* eslint-disable no-alert */
/* eslint-disable no-restricted-globals */

function toggleTemplateTypeButton(form, e) {
  const { targetType } = e.target.dataset;
  const activeType = targetType === 'personal' ? 'moderator' : 'personal';
  e.target.classList.toggle('active');
  form
    .querySelector(`.${activeType}-template-button`)
    .classList.toggle('active');
  form
    .querySelector(`.${targetType}-responses-container`)
    .classList.toggle('hidden');
  form
    .querySelector(`.${activeType}-responses-container`)
    .classList.toggle('hidden');
}

const noResponsesHTML = `
<div class="mod-response-wrapper mod-response-wrapper-empty">
  <p>🤔... It looks like you don't have any templates yet.</p>
</div>
`;

function buildHTML(response, typeOf) {
  if (response.length === 0 && typeOf === 'personal_comment') {
    return noResponsesHTML;
  }
  if (typeOf === 'personal_comment') {
    return response
      .map((obj) => {
        return `
          <div class="mod-response-wrapper flex mb-4">
            <div class="flex-1">
              <h4>${obj.title}</h4>
              <p>${obj.content}</p>
            </div>
            <div class="pl-2">
              <button class="crayons-btn crayons-btn--secondary crayons-btn--s insert-template-button" type="button" data-content="${obj.content}">Insert</button>
            </div>
          </div>
        `;
      })
      .join('');
  }
  if (typeOf === 'mod_comment') {
    return response
      .map((obj) => {
        return `
            <div class="mod-response-wrapper mb-4 flex">
              <div class="flex-1">
                <h4>${obj.title}</h4>
                <p>${obj.content}</p>
              </div>
              <div class="flex flex-nowrap pl-2">
                <button class="crayons-btn crayons-btn--s crayons-btn--secondary moderator-submit-button" type="submit" data-response-template-id="${obj.id}">Send as Mod</button>
                <button class="crayons-btn crayons-btn--s crayons-btn--outlined insert-template-button" type="button" data-content="${obj.content}">Insert</button>
              </div>
            </div>
          `;
      })
      .join('');
  }
  return `Error 😞`;
}

function submitAsModerator(responseTemplateId, parentId) {
  const commentableId = document.querySelector('input#comment_commentable_id')
    .value;

  fetch(`/comments/moderator_create`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'X-CSRF-Token': window.csrfToken,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      response_template: {
        id: responseTemplateId,
      },
      comment: {
        body_markdown: '',
        commentable_id: commentableId,
        commentable_type: 'Article',
        parent_id: parentId,
      },
    }),
  })
    .then((response) => response.json())
    .then((response) => {
      if (response.status === 'created') {
        window.location.pathname = response.path;
      } else if (response.status === 'comment already exists') {
        alert('This comment already exists.');
      } else if (response.error === 'error') {
        alert(
          `There was a problem submitting this comment: ${response.status}`,
        );
      }
    });
}

const confirmMsg = `
Are you sure you want to submit this comment as Sloan?

It will be sent immediately and users will be notified.

Make sure this is the appropriate comment for the situation.

This action is not reversible.`;

function addClickListeners(form) {
  const responsesContainer = form.querySelector(
    '.response-templates-container',
  );
  const parentCommentId =
    form.id !== 'new_comment' && !form.id.includes('edit_comment');
  const insertButtons = Array.from(
    responsesContainer.getElementsByClassName('insert-template-button'),
  );
  const moderatorSubmitButtons = Array.from(
    responsesContainer.getElementsByClassName('moderator-submit-button'),
  );

  insertButtons.forEach((button) => {
    button.addEventListener('click', (e) => {
      const { content } = e.target.dataset;
      const textArea = form.querySelector('textarea');
      const textAreaReplaceable =
        textArea.value === null ||
        textArea.value === '' ||
        confirm('Are you sure you want to replace your current comment draft?');

      if (textAreaReplaceable) {
        textArea.value = content;
        textArea.focus();
        responsesContainer.classList.toggle('hidden');
      }
    });
  });

  moderatorSubmitButtons.forEach((button) => {
    button.addEventListener('click', (e) => {
      e.preventDefault();

      if (confirm(confirmMsg)) {
        submitAsModerator(e.target.dataset.responseTemplateId, parentCommentId);
      }
    });
  });
}

function fetchResponseTemplates(typeOf, formId) {
  const form = document.getElementById(formId);
  let dataContainer;
  if (typeOf === 'personal_comment') {
    dataContainer = form.querySelector('.personal-responses-container');
  } else if (typeOf === 'mod_comment') {
    dataContainer = form.querySelector('.moderator-responses-container');
  }
  /* eslint-disable-next-line no-undef */
  fetch(`/response_templates?type_of=${typeOf}`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      'X-CSRF-Token': window.csrfToken,
      'Content-Type': 'application/json',
    },
  })
    .then((response) => response.json())
    .then((response) => {
      form.querySelector('img.loading-img').classList.toggle('hidden');
      dataContainer.innerHTML = buildHTML(response, typeOf);
      const topLevelData = document.getElementById('response-templates-data');
      topLevelData.innerHTML = dataContainer.parentElement.innerHTML;
      addClickListeners(form);
    });
}

function prepareHeaderButtons(form) {
  const personalTemplateButton = form.querySelector(
    '.personal-template-button',
  );
  const modTemplateButton = form.querySelector('.moderator-template-button');

  personalTemplateButton.addEventListener('click', (e) => {
    toggleTemplateTypeButton(form, e);
  });
  modTemplateButton.addEventListener('click', (e) => {
    toggleTemplateTypeButton(form, e);
  });
  modTemplateButton.classList.remove('hidden');

  modTemplateButton.addEventListener(
    'click',
    () => {
      const topLevelData = document.getElementById('response-templates-data');
      const modDataNotFetched =
        topLevelData.innerHTML !== ''
          ? topLevelData.querySelector('.moderator-responses-container')
              .childElementCount === 0
          : false;
      if (modDataNotFetched) {
        form.querySelector('img.loading-img').classList.toggle('hidden');
        fetchResponseTemplates('mod_comment', form.id);
      }
    },
    { once: true },
  );
}

function copyData(responsesContainer) {
  responsesContainer.innerHTML = document.getElementById(
    'response-templates-data',
  ).innerHTML;
}

function loadData(form) {
  form.querySelector('img.loading-img').classList.toggle('hidden');
  fetchResponseTemplates('personal_comment', form.id);
}

function openButtonCallback(form) {
  const responsesContainer = form.querySelector(
    '.response-templates-container',
  );
  const dataFetched =
    document.getElementById('response-templates-data').innerHTML !== '';

  responsesContainer.classList.toggle('hidden');

  const containerHidden = responsesContainer.classList.contains('hidden');

  if (dataFetched && !containerHidden) {
    copyData(responsesContainer);
    addClickListeners(form);
  } else if (!dataFetched && !containerHidden) {
    loadData(form);
  }
  /* eslint-disable-next-line no-undef */
  if (userData().moderator_for_tags.length > 0) {
    prepareHeaderButtons(form);
  } else {
    form.querySelector('.personal-template-button').classList.add('hidden');
  }
}

function prepareOpenButton(form) {
  const button = form.querySelector('.response-templates-button');
  if (!button) {
    return;
  }

  button.addEventListener('click', () => {
    openButtonCallback(form);
  });

  button.dataset.hasListener = 'true';
}

function observeForReplyClick() {
  const config = { childList: true, subtree: true };

  const callback = (mutations) => {
    const form = Array.from(mutations[0].addedNodes).filter(
      (node) => node.nodeName === 'FORM',
    );
    if (form.length > 0) {
      prepareOpenButton(form[0]);
    }
  };

  const observer = new MutationObserver(callback);

  const commentTree = document.getElementById('comment-trees-container');
  if (commentTree) {
    observer.observe(commentTree, config);
  }

  window.addEventListener('beforeunload', () => {
    observer.disconnect();
  });

  window.InstantClick.on('change', () => {
    observer.disconnect();
  });
}

function handleLoggedOut() {
  // global method from app/assets/javascripts/utilities/showModal.js
  document
    .querySelector('.response-templates-button')
    ?.addEventListener('click', showModal); /* eslint-disable-line no-undef */
}
/* eslint-enable no-alert */
/* eslint-enable no-restricted-globals */

export function loadResponseTemplates() {
  const { userStatus } = document.body.dataset;

  const form = document.querySelector('.comment-form');

  if (document.getElementById('response-templates-data')) {
    if (userStatus === 'logged-out') {
      handleLoggedOut();
    }
    if (
      form &&
      form.querySelector('.response-templates-button').dataset.hasListener ===
        'false'
    ) {
      prepareOpenButton(form);
    }
    observeForReplyClick();
  }
}

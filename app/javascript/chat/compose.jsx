import { h } from 'preact';
import { useState, useEffect, useMemo } from 'preact/hooks';
import PropTypes from 'prop-types';
import Textarea from 'preact-textarea-autosize';

const Compose = ({
  handleKeyDown,
  handleKeyDownEdit,
  handleSubmitOnClick,
  handleSubmitOnClickEdit,
  handleMention,
  handleKeyUp,
  startEditing,
  markdownEdited,
  editMessageMarkdown,
  handleEditMessageClose,
  handleFilePaste,
}) => {
  const [value, setValue] = useState('');

  useEffect(() => {
    if (!markdownEdited && startEditing) {
      setValue(editMessageMarkdown);
    }
  }, [markdownEdited, startEditing, editMessageMarkdown]);

  const onKeyDown = (event) => {
    const shiftPressed = event.shiftKey;
    if (startEditing) handleKeyDownEdit(event);
    else handleKeyDown(event);

    if (event.keyCode === 13 && !shiftPressed) {
      event.preventDefault();
      setValue('');
    }
  };

  const placeholder = useMemo(
    () => (startEditing ? "Let's connect" : 'Write message...'),
    [startEditing],
  );
  const label = useMemo(
    () => (startEditing ? "Let's connect" : 'Compose a message'),
    [startEditing],
  );
  const saveButtonText = useMemo(() => (startEditing ? 'Save' : 'Send'), [
    startEditing,
  ]);

  return (
    <div className="compose__outer__container">
      <div
        className={
          startEditing ? 'composer-container__edit' : 'messagecomposer'
        }
      >
        <Textarea
          className={
            startEditing
              ? 'crayons-textfield composer-textarea__edit'
              : 'crayons-textfield composer-textarea'
          }
          id="messageform"
          data-testid="messageform"
          placeholder={placeholder}
          onKeyDown={onKeyDown}
          onKeyPress={handleMention}
          onKeyUp={handleKeyUp}
          onPaste={handleFilePaste}
          maxLength="1000"
          value={value}
          onInput={(event) => setValue(event.target.value)}
          aria-label={label}
        />
        <div className="composer-btn-group">
          <button
            type="button"
            className={
              startEditing
                ? 'composer-submit composer-submit__edit crayons-btn'
                : 'crayons-btn composer-submit'
            }
            onClick={(event) => {
              if (startEditing) handleSubmitOnClickEdit(event);
              else handleSubmitOnClick(event);

              setValue('');
            }}
          >
            {saveButtonText}
          </button>
          {startEditing && (
            <button
              type="button"
              className="composer-close__edit crayons-btn crayons-btn--secondary"
              onClick={(event) => {
                handleEditMessageClose(event);
                setValue('');
              }}
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

Compose.propTypes = {
  handleKeyDown: PropTypes.func.isRequired,
  handleKeyDownEdit: PropTypes.func.isRequired,
  handleSubmitOnClick: PropTypes.func.isRequired,
  handleSubmitOnClickEdit: PropTypes.func.isRequired,
  handleMention: PropTypes.func.isRequired,
  handleKeyUp: PropTypes.func.isRequired,
  startEditing: PropTypes.bool.isRequired,
  markdownEdited: PropTypes.bool.isRequired,
  editMessageMarkdown: PropTypes.string.isRequired,
  handleEditMessageClose: PropTypes.func.isRequired,
  handleFilePaste: PropTypes.func.isRequired,
};

export default Compose;

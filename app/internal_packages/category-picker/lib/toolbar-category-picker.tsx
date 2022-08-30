import React from 'react';
import {
  localized,
  Actions,
  Account,
  PropTypes,
  AccountStore,
  WorkspaceStore,
  Thread,
  Message,
} from 'mailspring-exports';
import { RetinaImg, KeyCommandsRegion } from 'mailspring-component-kit';

import MovePickerPopover from './move-picker-popover';
import LabelPickerPopover from './label-picker-popover';

// This sets the folder / label on one or more threads.
class MovePicker extends React.Component<{ threads: Thread[]; messages: Message[] }> {
  static displayName = 'MovePicker';
  static containerRequired = false;

  static propTypes = { items: PropTypes.array };
  static contextTypes = { sheetDepth: PropTypes.number };

  _account: Account;
  _labelEl: HTMLElement;
  _moveEl: HTMLButtonElement;

  constructor(props) {
    super(props);

    this._account = MovePicker._findAccount(this.props);
  }

  _hasThreadOrMessage = () => this.props.threads?.length || this.props.messages?.length;

  private static _findAccount(props: { threads: Thread[]; messages: Message[] }) {
    if (props.threads?.length) {
      return AccountStore.accountForItems(props.threads);
    } else if (props.messages?.length) {
      let accountIds = props.messages?.map(msg => msg.accountId);

      if (accountIds.length > 1) {
        accountIds = [...new Set(...accountIds)];
      }

      if (accountIds.length === 1) {
        return AccountStore.accountForId(accountIds[0]);
      }
    }

    return null;
  }

  // If the threads we're picking categories for change, (like when they
  // get their categories updated), we expect our parents to pass us new
  // props. We don't listen to the DatabaseStore ourselves.
  componentWillReceiveProps(nextProps) {
    this._account = MovePicker._findAccount(nextProps);
  }

  _onOpenLabelsPopover = () => {
    if (!this._hasThreadOrMessage()) {
      return;
    }
    if (this.context.sheetDepth !== WorkspaceStore.sheetStack().length - 1) {
      return;
    }
    Actions.openPopover(
      <LabelPickerPopover threads={this.props.threads} account={this._account} />,
      {
        originRect: this._labelEl.getBoundingClientRect(),
        direction: 'down',
      }
    );
  };

  _onOpenMovePopover = () => {
    if (!this._hasThreadOrMessage()) {
      return;
    }
    if (this.context.sheetDepth !== WorkspaceStore.sheetStack().length - 1) {
      return;
    }
    Actions.openPopover(
      <MovePickerPopover
        threads={this.props.threads}
        messages={this.props.messages}
        account={this._account}
      />,
      {
        originRect: this._moveEl.getBoundingClientRect(),
        direction: 'down',
      }
    );
  };

  render() {
    if (!this._account) {
      return <span />;
    }

    const handlers = {
      'core:change-folders': this._onOpenMovePopover,
    };
    if (this._account.usesLabels()) {
      Object.assign(handlers, {
        'core:change-labels': this._onOpenLabelsPopover,
      });
    }

    return (
      <div className="button-group" style={{ order: -103 }}>
        <KeyCommandsRegion globalHandlers={handlers}>
          <button
            tabIndex={-1}
            ref={el => (this._moveEl = el)}
            title={localized('Move to Folder')}
            onClick={this._onOpenMovePopover}
            className={'btn btn-toolbar btn-category-picker'}
          >
            <RetinaImg name={'toolbar-movetofolder.png'} mode={RetinaImg.Mode.ContentIsMask} />
          </button>
          {this._account.usesLabels() && (
            <button
              tabIndex={-1}
              ref={el => (this._labelEl = el)}
              title={localized('Apply Label')}
              onClick={this._onOpenLabelsPopover}
              className={'btn btn-toolbar btn-category-picker'}
            >
              <RetinaImg name={'toolbar-tag.png'} mode={RetinaImg.Mode.ContentIsMask} />
            </button>
          )}
        </KeyCommandsRegion>
      </div>
    );
  }
}

export default MovePicker;

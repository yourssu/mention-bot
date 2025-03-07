import {
  AllMiddlewareArgs,
  Middleware,
  SlackAction,
  SlackActionMiddlewareArgs,
  SlackCommandMiddlewareArgs,
  SlackEventMiddlewareArgs,
  StringIndexed,
} from '@slack/bolt';

export type BaseSlackMessageEvent<CustomContext extends StringIndexed = StringIndexed> =
  AllMiddlewareArgs<CustomContext> & SlackEventMiddlewareArgs<'message'>;

export type BaseSlackMessageMiddleware = Middleware<
  SlackEventMiddlewareArgs<'message'>,
  StringIndexed
>;

export type SlackMessageEvent<CustomContext extends StringIndexed = StringIndexed> = {
  message: {
    team: string;
    text: string;
    thread_ts?: string; // eslint-disable-line @typescript-eslint/naming-convention
    user: string;
  } & BaseSlackMessageEvent<CustomContext>['message'];
} & Omit<BaseSlackMessageEvent<CustomContext>, 'message'>;

export type SlackCommandEvent<CustomContext extends StringIndexed = StringIndexed> =
  AllMiddlewareArgs<CustomContext> & SlackCommandMiddlewareArgs;

export type SlackActionEvent<CustomContext extends StringIndexed = StringIndexed> =
  AllMiddlewareArgs<CustomContext> & SlackActionMiddlewareArgs<SlackAction>;

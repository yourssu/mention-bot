import {
  AllMiddlewareArgs,
  Middleware,
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
    user: string;
  } & BaseSlackMessageEvent<CustomContext>['message'];
} & Omit<BaseSlackMessageEvent<CustomContext>, 'message'>;

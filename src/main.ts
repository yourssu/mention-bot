import { Member } from '@slack/web-api/dist/types/response/UsersListResponse';

import { getAllSlackMembers } from '@/apis/member';
import { slackApp } from '@/core/slack';
import { NotionMemberPosition } from '@/types/member';
import { findSlackMemberByNotionMember, getNotionMembersWithPosition } from '@/utils/member';

const test = async () => {
  NotionMemberPosition.map(async (position) => {
    const notionMembers = await getNotionMembersWithPosition(position);
    await getAllSlackMembers(); // for ensure slack members cached
    const slackMembers = (
      await Promise.all(
        notionMembers.map((member) => {
          return findSlackMemberByNotionMember(member);
        })
      )
    ).filter(Boolean) as Member[];
    console.log(position, notionMembers.length, slackMembers.length);
  });
};

(async () => {
  await slackApp.start(3000);
  slackApp.logger.info('⚡️ Bolt app is running!');

  // await test();
})();

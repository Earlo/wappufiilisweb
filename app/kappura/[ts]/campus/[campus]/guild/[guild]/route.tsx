import {
  createPlot,
  groupEntriesByDay,
  listAllData,
} from '../../../../../utils';

type Props = {
  params: { ts: string; campus: string; guild: string };
};

export async function GET(req: Request, { params }: Props) {
  const { campus, guild } = params;

  const tableName =
    process.env.DYNAMODB_EVENTS_PER_GUILD_TABLE_NAME ||
    'FiilisData_PerGuild_staging';

  const partitionKeyBeginning = `${campus}::${guild}`;

  const entries = await listAllData(tableName, partitionKeyBeginning);
  const data = groupEntriesByDay(entries).sort((a, b) => a.date - b.date);

  return createPlot(data);
}

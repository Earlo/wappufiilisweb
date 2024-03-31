import { createPlot, groupEntriesByDay, listAllData } from '../utils';

type Props = {
  params: { ts: string; campus: string };
};

export async function GET(req: Request, { params }: Props) {
  const tableName =
    process.env.DYNAMODB_EVENTS_TABLE_NAME || 'FiilisData_staging';

  const entries = await listAllData(tableName, '');
  const data = groupEntriesByDay(entries).sort((a, b) => a.date - b.date);

  return createPlot(data);
}

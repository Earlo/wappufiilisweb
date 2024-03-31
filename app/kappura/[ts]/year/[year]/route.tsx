import { createPlot, groupEntriesByDay, listAllData } from '../../../utils';

type Props = {
  params: { ts: string; year: string };
};

export async function GET(req: Request, { params }: Props) {
  const { year } = params;

  const tableName =
    process.env.DYNAMODB_EVENTS_PER_YEAR_TABLE_NAME ||
    'FiilisData_PerYear_staging';

  const entries = await listAllData(tableName, year);
  const data = groupEntriesByDay(entries).sort((a, b) => a.date - b.date);

  return createPlot(data);
}

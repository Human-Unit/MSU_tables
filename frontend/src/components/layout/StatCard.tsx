import {Card, CardContent} from '../ui/card';

type StatCardProps = {
  label: string;
  value: number | string;
};

export function StatCard({label, value}: StatCardProps) {
  return (
    <Card>
      <CardContent className="p-5">
        <p className="text-sm text-slate-500">{label}</p>
        <p className="mt-2 text-3xl font-semibold text-slate-950">{value}</p>
      </CardContent>
    </Card>
  );
}


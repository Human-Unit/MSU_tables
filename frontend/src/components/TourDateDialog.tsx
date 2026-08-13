import {useState, useEffect} from 'react';
import {Dialog, DialogBody, DialogContent, DialogDescription, DialogHeader, DialogTitle} from './ui/dialog';
import {Button} from './ui/button';
import {Input} from './ui/input';
import {useI18n} from '../i18n';

type TourDateDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  disciplineId: string;
  disciplineName: string;
  tourNumber: number;
  onConfirm: (disciplineId: string, tourNumber: number, date: string) => void;
};

// Base date: 01.05.2026 - used for estimated dates
const BASE_DATE_ISO = '2026-05-01';

export function TourDateDialog({
  open,
  onOpenChange,
  disciplineId,
  disciplineName,
  tourNumber,
  onConfirm,
}: TourDateDialogProps) {
  const {t} = useI18n();
  const [dateValue, setDateValue] = useState('');

  // Get estimated date based on tour number
  const getEstimatedDate = (): string => {
    const base = new Date(BASE_DATE_ISO);
    const date = new Date(base);
    date.setDate(date.getDate() + (tourNumber - 1) * 30);
    return date.toISOString().slice(0, 10);
  };

  // Reset to estimated date when dialog opens
  useEffect(() => {
    if (open) {
      setDateValue(getEstimatedDate());
    }
  }, [open, tourNumber]);

  const handleConfirm = () => {
    if (dateValue) {
      onConfirm(disciplineId, tourNumber, dateValue);
      onOpenChange(false);
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t('journal.addTour')}</DialogTitle>
          <DialogDescription>
            {t('journal.tourDatePrompt', {subject: disciplineName, tour: tourNumber})}
          </DialogDescription>
        </DialogHeader>
        <DialogBody>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">
                {t('field.date')}
              </label>
              <Input
                type="date"
                value={dateValue}
                onChange={(e) => setDateValue(e.target.value)}
                max={new Date().toISOString().slice(0, 10)} // Can't select future dates
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="secondary" onClick={handleCancel}>
                {t('common.cancel')}
              </Button>
              <Button type="button" onClick={handleConfirm} disabled={!dateValue}>
                {t('common.save')}
              </Button>
            </div>
          </div>
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import { USER_NAME, USER_EMAIL, USER_INITIALS, USER_PLAN } from '@/constants/user';
import { useCredits } from '@/contexts/CreditsContext';

interface AccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AccountDialog({ open, onOpenChange }: AccountDialogProps) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('account');
  const { credits, subscriptionCredits, topupCredits, giftCredits, usageHistory } = useCredits();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[900px] w-[90vw] h-[80vh] p-0 gap-0 overflow-hidden bg-background/70 backdrop-blur-xl border-border/50">
        <div className="p-6 pb-0">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="bg-transparent border-b border-border rounded-none w-full justify-start gap-6 px-0 h-auto pb-0">
              <TabsTrigger
                value="account"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none px-1 pb-3 text-base font-normal">
                {t('common.accountManagement')}
              </TabsTrigger>
              <TabsTrigger
                value="usage"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none px-1 pb-3 text-base font-normal text-muted-foreground">
                {t('common.usage')}
              </TabsTrigger>
            </TabsList>

            {/* Account Tab */}
            <TabsContent value="account" className="mt-6 space-y-6">
              <div className="border border-border rounded-xl p-6 flex items-center gap-4">
                  <Avatar className="w-14 h-14">
                    <AvatarFallback className="bg-primary text-primary-foreground text-xl font-semibold">
                      {USER_INITIALS}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-base font-semibold text-foreground">{USER_NAME}</p>
                    <p className="text-sm text-muted-foreground font-light">{USER_EMAIL}</p>
                  </div>
              </div>

              <div className="border border-border rounded-xl p-6">
                <div className="flex gap-8 mb-6">
                  <span className="text-base text-foreground border-b-2 border-foreground pb-2 font-light">
                    {t('common.accountManagement')}
                  </span>
                </div>
                <div className="space-y-4 text-sm">
                  <div className="flex items-center text-lg font-light text-accent">
                    <span className="text-muted-foreground w-40 font-thin">{t('common.currentPlan')}</span>
                    <span className="text-foreground font-light">{USER_PLAN}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-muted-foreground w-40 font-light">{t('common.availableCredits')}</span>
                    <span className="text-foreground font-normal tabular-nums">{credits}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-muted-foreground w-40 font-light pl-4">{t('common.subscriptionCredits')}</span>
                    <span className="text-foreground font-light tabular-nums">{subscriptionCredits}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-muted-foreground w-40 font-light pl-4">{t('common.topupCredits')}</span>
                    <span className="text-foreground font-light tabular-nums">{topupCredits}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-muted-foreground w-40 font-light pl-4">{t('common.giftCredits')}</span>
                    <span className="text-foreground font-light tabular-nums">{giftCredits}</span>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Usage Tab */}
            <TabsContent value="usage" className="mt-6">
              <div className="border border-border rounded-xl overflow-hidden">
                <div className="bg-muted/50 px-6 py-3 flex items-center text-sm font-medium text-muted-foreground gap-[120px]">
                  <span className="flex-1 mx-0 mr-[150px]">{t('common.usageDetails')}</span>
                  
                  <span className="w-48 text-center">日期</span>
                  <span className="w-32 text-right">{t('common.credits')}</span>
                </div>
                {usageHistory.map((record) =>
                <div key={record.id} className="px-6 py-4 flex items-center text-sm border-t border-border gap-[120px]">
                    <span className="flex-1 text-foreground mr-[150px]">{record.label}</span>
                    <span className="w-48 text-center text-muted-foreground">
                      {new Date(record.date).toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                    <span className={`w-32 text-right tabular-nums font-medium ${record.status === '已消耗' ? 'text-destructive' : 'text-foreground'}`}>
                      {record.status === '已消耗' ? '-' : '+'}{record.amount}
                    </span>
                  </div>
                )}
                {usageHistory.length === 0 &&
                <div className="py-8 text-center text-muted-foreground text-sm">
                    暂无更多数据
                  </div>
                }
              </div>
            </TabsContent>

          </Tabs>
        </div>
      </DialogContent>
    </Dialog>);
}
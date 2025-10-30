import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Trophy, Coins, Gift, Star, Zap, Loader2 } from "lucide-react";
import { useProfile, useRewards, useRedeemReward } from "@/hooks/useDatabase";
import ecoCoin from "@/assets/eco-coin.jpg";

const defaultBadges = [
  { name: "Eco Warrior", description: "Recycled 10+ items", threshold: 10, icon: "🌱" },
  { name: "Recycle Champ", description: "Earned 1000+ EcoCoins", threshold: 1000, icon: "🏆" },
  { name: "Zero-Waste Hero", description: "Recycled 50+ items", threshold: 50, icon: "⭐" },
  { name: "Planet Saver", description: "Prevented 100kg CO₂", threshold: 100, icon: "🌍" },
];

export const RewardsSection = () => {
  const { data: profile, isLoading: profileLoading } = useProfile();
  const { data: rewards = [], isLoading: rewardsLoading } = useRewards();
  const redeemReward = useRedeemReward();
  const [selectedReward, setSelectedReward] = useState<string | null>(null);

  const handleRedeem = (reward: any) => {
    if (profile && profile.eco_coins >= reward.coins_required) {
      redeemReward.mutate({
        rewardId: reward.id,
        coinsSpent: reward.coins_required
      });
      setSelectedReward(null);
    }
  };

  const userCoins = profile?.eco_coins || 0;
  const totalRecycled = profile?.total_items_recycled || 0;
  const totalCoins = profile?.eco_coins || 0;
  const co2Saved = profile?.total_co2_saved || 0;
  const userBadges = profile?.badges || [];

  // Calculate which badges are unlocked
  const badgesWithStatus = defaultBadges.map(badge => ({
    ...badge,
    unlocked: badge.name === "Eco Warrior" ? totalRecycled >= badge.threshold :
              badge.name === "Recycle Champ" ? totalCoins >= badge.threshold :
              badge.name === "Zero-Waste Hero" ? totalRecycled >= badge.threshold :
              badge.name === "Planet Saver" ? co2Saved >= badge.threshold :
              false
  }));

  const unlockedBadges = badgesWithStatus.filter(badge => badge.unlocked);
  const nextBadge = badgesWithStatus.find(badge => !badge.unlocked);

  return (
    <section id="rewards" className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8 bg-muted/30">
      <div className="container mx-auto">
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4">
            Earn & Redeem{" "}
            <span className="">
              EcoCoins
            </span>
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
            Turn your environmental actions into real rewards. Every piece of e-waste
            you recycle earns EcoCoins that can be redeemed for amazing prizes!
          </p>
        </div>

        {/* User Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-8 sm:mb-12">
          <Card className="p-4 sm:p-6 text-center bg-gradient-card">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-reward rounded-full mx-auto mb-3 sm:mb-4 flex items-center justify-center">
              {profileLoading ? (
                <Loader2 className="w-6 h-6 sm:w-8 sm:h-8 text-white animate-spin" />
              ) : (
                <img src={ecoCoin} alt="EcoCoin" className="w-8 h-8 sm:w-10 sm:h-10 rounded-full" />
              )}
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-reward mb-2">{userCoins}</div>
            <div className="text-sm sm:text-base text-muted-foreground">Available EcoCoins</div>
          </Card>

          <Card className="p-4 sm:p-6 text-center bg-gradient-card">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-primary rounded-full mx-auto mb-3 sm:mb-4 flex items-center justify-center">
              <Trophy className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-primary mb-2">{totalRecycled}</div>
            <div className="text-sm sm:text-base text-muted-foreground">Items Recycled</div>
          </Card>

          <Card className="p-4 sm:p-6 text-center bg-gradient-card">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-secondary rounded-full mx-auto mb-3 sm:mb-4 flex items-center justify-center">
              <Star className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-secondary mb-2">{unlockedBadges.length}</div>
            <div className="text-sm sm:text-base text-muted-foreground">Badges Earned</div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Rewards Marketplace */}
          <div>
            <h3 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 flex items-center gap-2">
              <Gift className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
              Rewards Marketplace
            </h3>
            
            {rewardsLoading ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="w-8 h-8 animate-spin" />
                <span className="ml-2">Loading rewards...</span>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-4">
                {rewards.map((reward) => (
                  <Card
                    key={reward.id}
                    className={`p-4 cursor-pointer transition-all hover:shadow-medium ${
                      selectedReward === reward.id ? 'ring-2 ring-primary shadow-glow' : ''
                    }`}
                    onClick={() => setSelectedReward(reward.id)}
                  >
                    <div className="text-center">
                      <div className="text-3xl mb-2">{reward.icon || "🎁"}</div>
                      <h4 className="font-semibold mb-2">{reward.name}</h4>
                      <div className="text-sm text-muted-foreground mb-3">{reward.discount_value || reward.description}</div>

                      <div className="flex items-center justify-center gap-1 mb-3">
                        <img src={ecoCoin} alt="EcoCoin" className="w-4 h-4 rounded-full" />
                        <span className="font-bold text-reward">{reward.coins_required}</span>
                      </div>

                      <Button
                        variant={userCoins >= reward.coins_required ? "reward" : "outline"}
                        size="sm"
                        className="w-full"
                        disabled={userCoins < reward.coins_required || redeemReward.isPending}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRedeem(reward);
                        }}
                      >
                        {redeemReward.isPending ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Redeeming...
                          </>
                        ) : userCoins >= reward.coins_required ? "Redeem" : "Need More Coins"}
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Badges & Achievements */}
          <div>
            <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Trophy className="w-6 h-6 text-primary" />
              Eco Badges
            </h3>
            
            <div className="space-y-4">
              {badgesWithStatus.map((badge, index) => (
                <Card key={index} className={`p-4 ${badge.unlocked ? 'bg-gradient-card' : 'bg-muted/50'}`}>
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl ${
                      badge.unlocked ? 'bg-gradient-primary' : 'bg-muted'
                    }`}>
                      {badge.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold">{badge.name}</h4>
                        {badge.unlocked && (
                          <Badge variant="secondary" className="bg-success text-white">
                            Unlocked
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{badge.description}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Progress to Next Badge */}
            {nextBadge && (
              <Card className="p-6 mt-6 bg-gradient-card">
                <h4 className="font-semibold mb-4 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-primary" />
                  Next Achievement
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>{nextBadge.name} Progress</span>
                    <span>{
                      nextBadge.name === "Eco Warrior" ? `${totalRecycled}/${nextBadge.threshold}` :
                      nextBadge.name === "Recycle Champ" ? `${totalCoins}/${nextBadge.threshold}` :
                      nextBadge.name === "Zero-Waste Hero" ? `${totalRecycled}/${nextBadge.threshold}` :
                      nextBadge.name === "Planet Saver" ? `${co2Saved}/${nextBadge.threshold}` :
                      "0/1"
                    }</span>
                  </div>
                  <Progress value={
                    nextBadge.name === "Eco Warrior" ? (totalRecycled / nextBadge.threshold) * 100 :
                    nextBadge.name === "Recycle Champ" ? (totalCoins / nextBadge.threshold) * 100 :
                    nextBadge.name === "Zero-Waste Hero" ? (totalRecycled / nextBadge.threshold) * 100 :
                    nextBadge.name === "Planet Saver" ? (co2Saved / nextBadge.threshold) * 100 :
                    0
                  } className="h-2" />
                  <p className="text-sm text-muted-foreground">
                    {nextBadge.description}
                  </p>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

type NewLinkRequest = {
  originalUrl: string;
};

type LinkParam = {
  targetLinkId: string;
};

type DeleteLinkRequest = {
  targetUserId: string;
  targetLinkId: string;
};

type UserIdParam = {
  targetUserId: string;
};

/**
 * Types mirroring ZenBlogServer DTOs / feature commands & results.
 * Property names use camelCase to match ASP.NET Core's default
 * System.Text.Json naming policy (JsonNamingPolicy.CamelCase).
 *
 * Note: most successful Minimal API responses return unwrapped `T`
 * via `ToHttpResult()` (Results.Ok(result.Data)). Failures return
 * `Error[]` directly. The full `BaseResult<T>` envelope is written
 * by CustomExceptionHandlingMiddleware (`status` is [JsonIgnore] on the
 * server; the client treats `isSuccess` / non-empty `errors` as failure).
 */

// ─── Global response envelope ───────────────────────────────────────────────

export interface ApiError {
  propertyName?: string | null;
  errorMessage: string;
}

export interface BaseResult<T> {
  data: T | null;
  errors: ApiError[];
  isSuccess: boolean;
}

// ─── Shared / DTO base ──────────────────────────────────────────────────────

export interface BaseDto {
  id: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Auth ───────────────────────────────────────────────────────────────────

export interface LoginCommand {
  email: string;
  password: string;
}

export interface LoginResult {
  userId: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  imageUrl?: string | null;
  token: string;
  expiresAtUtc: string;
  refreshToken: string;
  refreshTokenExpiresAtUtc: string;
}

export interface RefreshTokenCommand {
  refreshToken: string;
}

export interface RefreshTokenResult {
  accessToken: string;
  accessTokenExpiresAtUtc: string;
  refreshToken: string;
  refreshTokenExpiresAtUtc: string;
}

// ─── User ───────────────────────────────────────────────────────────────────

export interface UserDto {
  id: string;
  username: string;
  imageUrl?: string | null;
}

export interface CreateUserCommand {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  password: string;
}

export interface CreateUserResult {
  id: string;
  username: string;
  email: string;
  fullName: string;
  createdAt: string;
}

export interface GetAllUsersQueryResult {
  id: string;
  username: string;
  email: string;
  fullName: string;
  imageUrl?: string | null;
}

export interface UserProfileResult {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  imageUrl?: string | null;
  imagePublicId?: string | null;
}

export interface PublicUserResult {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  imageUrl?: string | null;
}

export interface UpdateProfileCommand {
  firstName: string;
  lastName: string;
  imageUrl?: string | null;
  imagePublicId?: string | null;
}

export type ImageUploadPurpose = "Profile" | "BlogCover" | "BlogBody";

export interface UploadImageResult {
  url: string;
  publicId: string;
}

export interface ChangePasswordCommand {
  currentPassword: string;
  newPassword: string;
}

export interface DeleteMyAccountCommand {
  currentPassword: string;
}

// ─── Category ───────────────────────────────────────────────────────────────

export interface CategoryDto extends BaseDto {
  categoryName: string;
}

export interface GetCategoryQueryResult extends BaseDto {
  categoryName: string;
  blogs: BlogDto[];
}

export interface CreateCategoryCommand {
  categoryName: string;
}

export interface UpdateCategoryCommand {
  id: string;
  categoryName: string;
}

// ─── Blog ───────────────────────────────────────────────────────────────────

export interface BlogDto extends BaseDto {
  title: string;
  description: string;
  coverImageUrl?: string | null;
  coverImagePublicId?: string | null;
}

export interface GetBlogsQueryResult extends BaseDto {
  title: string;
  description: string;
  coverImageUrl?: string | null;
  coverImagePublicId?: string | null;
  categoryId: string;
  userId: string;
  category: CategoryDto;
  user?: UserDto;
}

/** Body for POST /blogs. UserId is set server-side from the JWT — do not send it. */
export interface CreateBlogCommand {
  title: string;
  description: string;
  coverImageUrl?: string | null;
  coverImagePublicId?: string | null;
  categoryId: string;
}

export interface CreateBlogResult {
  id: string;
  title: string;
}

export interface UpdateBlogCommand {
  id: string;
  title: string;
  description: string;
  coverImageUrl?: string | null;
  coverImagePublicId?: string | null;
  categoryId: string;
}

// ─── Comment ────────────────────────────────────────────────────────────────

export interface CommentResult extends BaseDto {
  body: string;
  blogId: string;
  userId: string;
  parentCommentId?: string | null;
  user: UserDto;
  replies: CommentResult[];
}

export interface CreateCommentCommand {
  body: string;
  blogId: string;
  parentCommentId?: string | null;
}

export interface CreateCommentResult {
  id: string;
  body: string;
  blogId: string;
  parentCommentId?: string | null;
}

export interface UpdateCommentCommand {
  id: string;
  body: string;
}

export interface SiteSettingsResult {
  allowRegistrations: boolean;
}

export interface UpdateSiteSettingsCommand {
  allowRegistrations: boolean;
}

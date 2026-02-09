import { apiClient } from './client'

// S3 presigned URL 발급 API
export async function getProfileImagePresignedUrl(
  fileName: string
): Promise<{ presigned_url: string; img_url: string; key: string }> {
  const { data } = await apiClient.put(
    '/api/v1/accounts/me/profile-image/presigned-url/',
    { file_name: fileName }
  )
  return data
}

// 프로필 이미지 URL 저장 API
export async function postProfileImageUrl(
  profile_img_url: string
): Promise<{ profile_img_url: string }> {
  const { data } = await apiClient.patch('/api/v1/accounts/me/profile-image/', {
    profile_img_url,
  })
  return data
}

// S3 presigned URL로 직접 이미지 업로드
export async function uploadImageToS3(
  presignedUrl: string,
  file: File
): Promise<void> {
  await fetch(presignedUrl, {
    method: 'PUT',
    body: file,
    headers: {
      'Content-Type': file.type,
    },
  })
}

// 내 정보 프로필 이미지 변경 전체 로직
export async function patchProfileImage(
  imageFile: File
): Promise<{ ok: boolean; message: string; img_url?: string }> {
  try {
    const { presigned_url, img_url } = await getProfileImagePresignedUrl(
      imageFile.name
    )
    await uploadImageToS3(presigned_url, imageFile)
    // S3 업로드 후, URL을 백엔드에 저장
    const encodedImgUrl = encodeURI(img_url)
    await postProfileImageUrl(encodedImgUrl)
    return { ok: true, message: '프로필 사진이 등록되었습니다.', img_url: encodedImgUrl }
  } catch (e: any) {
    if (e.response && e.response.status === 401) {
      return { ok: false, message: '인증 오류: 다시 로그인하세요.' }
    }
    return { ok: false, message: '이미지 업로드 실패' }
  }
}

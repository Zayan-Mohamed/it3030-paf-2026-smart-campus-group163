package com.smartcampus.api.dto.user;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserListDto {
    private List<UserDto> users;
    private long totalElements;
    private int totalPages;
    private int currentPage;
}

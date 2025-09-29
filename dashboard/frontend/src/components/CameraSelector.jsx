import React from "react";
import {
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Avatar,
} from "@mui/material";
import { VideoCall as CameraIcon } from "@mui/icons-material";

/**
 * Modern camera selector component with Material-UI styling
 * Features:
 * - Clean select dropdown with proper labeling
 * - Camera icon for visual clarity
 * - Consistent Material Design patterns
 */
export default function CameraSelector({ locations, selected, onChange }) {
  return (
    <Box>
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
        <Avatar
          sx={{
            bgcolor: "primary.main",
            width: 32,
            height: 32,
          }}
        >
          <CameraIcon fontSize="small" />
        </Avatar>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Camera Selection
        </Typography>
      </Box>

      <FormControl fullWidth>
        <InputLabel id="camera-select-label">Select Camera Feed</InputLabel>
        <Select
          labelId="camera-select-label"
          value={selected}
          label="Select Camera Feed"
          onChange={(e) => onChange(e.target.value)}
        >
          {locations.map((loc) => (
            <MenuItem key={loc.id} value={loc.id}>
              <Box sx={{ display: "flex", flexDirection: "column" }}>
                <Typography variant="body1">{loc.name}</Typography>
                {loc.location && (
                  <Typography variant="caption" color="text.secondary">
                    {loc.location}
                  </Typography>
                )}
              </Box>
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
}

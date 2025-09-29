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
<<<<<<< HEAD
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
=======
    <div className="mb-8 p-6 rounded-2xl bg-gradient-to-r from-slate-900 to-gray-900 shadow-lg border border-gray-700 hover:shadow-indigo-700/30 transition">
      <label className="font-semibold flex items-center gap-2 text-indigo-300 mb-3">
        <VideoCameraIcon className="w-6 h-6 text-indigo-400" />
        <span className="text-lg">Select Camera Feed</span>
      </label>
      <select
        className="w-full bg-slate-800 border-2 border-indigo-500 rounded-lg px-4 py-2 text-gray-100 font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-all"
        value={selected}
        onChange={(e) => onChange(e.target.value)}
      >
        {locations.map((loc) => (
          <option
            key={loc.id}
            value={loc.id}
            className="bg-slate-900 text-gray-100"
          >
            {loc.name}
          </option>
        ))}
      </select>
    </div>
>>>>>>> ea3d40be97ff3893c60530342170df6ec42e1285
  );
}
